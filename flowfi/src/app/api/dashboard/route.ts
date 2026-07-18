import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Vibrant, distinct colors for pie chart slices
const CHART_COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#e11d48", // Rose
  "#84cc16", // Lime
  "#a855f7", // Purple
  "#0ea5e9", // Sky
  "#d946ef", // Fuchsia
  "#22c55e", // Green
];

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");

    // Get all available months with transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: "asc" },
    });

    const availableMonths = new Set<string>();
    transactions.forEach((t) => {
      const d = new Date(t.date);
      availableMonths.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });

    const monthsList = Array.from(availableMonths).sort();

    // Determine target month
    let targetDate: Date;
    if (monthParam && availableMonths.has(monthParam)) {
      const [year, month] = monthParam.split("-").map(Number);
      targetDate = new Date(year, month - 1, 1);
    } else if (monthsList.length > 0) {
      const [year, month] = monthsList[monthsList.length - 1].split("-").map(Number);
      targetDate = new Date(year, month - 1, 1);
    } else {
      targetDate = new Date();
    }

    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    // Get monthly income
    const incomeResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "income",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    // Get monthly expenses
    const expenseResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "expense",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    // Get total balance (all time)
    const totalIncome = await prisma.transaction.aggregate({
      where: { userId, type: "income" },
      _sum: { amount: true },
    });

    const totalExpenses = await prisma.transaction.aggregate({
      where: { userId, type: "expense" },
      _sum: { amount: true },
    });

    const monthlyIncome = Number(incomeResult._sum.amount) || 0;
    const monthlyExpenses = Number(expenseResult._sum.amount) || 0;
    const balance = (Number(totalIncome._sum.amount) || 0) - (Number(totalExpenses._sum.amount) || 0);
    const savingsRate = monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;

    // Get spending by category
    const spendingByCategory = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type: "expense",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const categories = await prisma.category.findMany({
      where: {
        id: { in: spendingByCategory.map((s) => s.categoryId) },
      },
    });

    // Get transactions for each category
    const allMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: "expense",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { category: true },
      orderBy: { date: "desc" },
    });

    // Build raw per-categoryId slices, then merge duplicates that share the
    // same category name (case-insensitive). This is the root-cause fix for
    // "moving a transaction to Entertainment creates a second Entertainment
    // slice": multiple Category rows can exist with the same name but
    // different IDs (e.g. a user-scoped one + a global isDefault one), and
    // without this merge the pie chart splits them into separate slices.
    const rawSlices = spendingByCategory.map((item) => {
      const category = categories.find((c) => c.id === item.categoryId);
      const catId = item.categoryId;
      const allCatTransactions = allMonthTransactions.filter((t) => t.categoryId === catId);
      const catTransactions = allCatTransactions.slice(0, 20).map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        description: t.description,
        date: t.date,
        paymentMethod: t.paymentMethod,
      }));
      return {
        name: category?.name || "Unknown",
        normalizedName: (category?.name || "Unknown").toLowerCase().trim(),
        value: Number(item._sum.amount) || 0,
        categoryId: catId,
        transactionCount: allCatTransactions.length,
        transactions: catTransactions,
        category,
      };
    });

    // Merge slices that share the same normalized name. Prefer the
    // user-owned category (userId != null) as the canonical categoryId so
    // future recategorizations land in the same bucket the user sees.
    const mergedByName = new Map<string, typeof rawSlices[number]>();
    for (const slice of rawSlices) {
      const existing = mergedByName.get(slice.normalizedName);
      if (!existing) {
        mergedByName.set(slice.normalizedName, slice);
        continue;
      }
      // User-owned category wins as the canonical ID; otherwise keep the
      // one we already had (deterministic by groupBy order).
      const sliceIsUserOwned = slice.category?.userId != null;
      const existingIsUserOwned = existing.category?.userId != null;
      if (sliceIsUserOwned && !existingIsUserOwned) {
        mergedByName.set(slice.normalizedName, {
          ...slice,
          value: slice.value + existing.value,
          transactionCount: slice.transactionCount + existing.transactionCount,
          transactions: [...slice.transactions, ...existing.transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 20),
        });
      } else {
        mergedByName.set(slice.normalizedName, {
          ...existing,
          value: existing.value + slice.value,
          transactionCount: existing.transactionCount + slice.transactionCount,
          transactions: [...existing.transactions, ...slice.transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 20),
        });
      }
    }

    const categorySpending = Array.from(mergedByName.values())
      .sort((a, b) => b.value - a.value)
      .map((slice, index) => ({
        name: slice.name,
        value: slice.value,
        color: CHART_COLORS[index % CHART_COLORS.length],
        categoryId: slice.categoryId,
        transactionCount: slice.transactionCount,
        transactions: slice.transactions,
      }));

    // Get recent transactions for the month
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 5,
    });

    // Get monthly trend (last 6 months from target month)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth() - i, 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() - i + 1, 0);

      const [monthIncome, monthExpense] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: "income",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: "expense",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      monthlyTrend.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        income: Number(monthIncome._sum.amount) || 0,
        expenses: Number(monthExpense._sum.amount) || 0,
      });
    }

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      take: 3,
    });

    // Get all categories for parent-child relationships
    const allCategories = await prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { isDefault: true },
        ],
      },
    });

    const budgetSummaries = await Promise.all(
      budgets.map(async (budget) => {
        // Get subcategory IDs for this budget's category
        const subcategoryIds = allCategories
          .filter(c => c.parentId === budget.categoryId)
          .map(c => c.id);
        const allCategoryIds = [budget.categoryId, ...subcategoryIds];

        const result = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: { in: allCategoryIds },
            type: "expense",
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });

        return {
          name: budget.category?.name || "Unknown",
          budget: Number(budget.amount),
          spent: Number(result._sum.amount) || 0,
          color: budget.category?.color || "#6b7280",
        };
      })
    );

    const goals = await prisma.goal.findMany({
      where: { userId },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    const goalSummaries = goals.map((goal) => ({
      name: goal.name,
      target: Number(goal.targetAmount),
      current: Number(goal.currentAmount),
      progress: Number(goal.targetAmount) > 0
        ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
        : 0,
      color: goal.color || "#6366f1",
    }));

    const currentMonthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
    const currentMonthIndex = monthsList.indexOf(currentMonthKey);

    return NextResponse.json({
      balance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      spendingByCategory: categorySpending,
      recentTransactions,
      monthlyTrend,
      budgets: budgetSummaries,
      goals: goalSummaries,
      currentMonth: targetDate.toLocaleString("default", { month: "long", year: "numeric" }),
      currentMonthKey,
      availableMonths: monthsList,
      hasPrevMonth: currentMonthIndex > 0,
      hasNextMonth: currentMonthIndex < monthsList.length - 1,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
