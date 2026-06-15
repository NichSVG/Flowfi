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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Find the range of months with transactions
    const firstTransaction = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: "asc" },
      select: { date: true },
    });

    const latestTransaction = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    if (!firstTransaction || !latestTransaction) {
      return NextResponse.json({
        summary: { totalIncome: 0, totalExpenses: 0, totalSavings: 0, savingsRate: 0, avgMonthlyIncome: 0, avgMonthlyExpenses: 0 },
        spendingByCategory: [],
        monthlyTrend: [],
        weeklySpending: [],
        topExpenses: [],
        budgets: [],
        goals: [],
        periodLabel: "No data",
      });
    }

    const latestDate = new Date(latestTransaction.date);
    const periodEndDate = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0);
    const periodStartDate = new Date(latestDate.getFullYear(), latestDate.getMonth() - 5, 1);

    // Get 6-month totals
    const totalIncome = await prisma.transaction.aggregate({
      where: { userId, type: "income", date: { gte: periodStartDate, lte: periodEndDate } },
      _sum: { amount: true },
    });

    const totalExpenses = await prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: periodStartDate, lte: periodEndDate } },
      _sum: { amount: true },
    });

    const income = Number(totalIncome._sum.amount) || 0;
    const expenses = Number(totalExpenses._sum.amount) || 0;
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Spending by category (6 months)
    const spendingByCategory = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "expense", date: { gte: periodStartDate, lte: periodEndDate } },
      _sum: { amount: true },
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: spendingByCategory.map((s) => s.categoryId) } },
    });

    const categorySpending = spendingByCategory
      .sort((a, b) => Number(b._sum.amount) - Number(a._sum.amount))
      .map((item, index) => {
      const category = categories.find((c) => c.id === item.categoryId);
      return {
        name: category?.name || "Unknown",
        value: Number(item._sum.amount) || 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });

    // Monthly trend (6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(latestDate.getFullYear(), latestDate.getMonth() - i, 1);
      const monthEnd = new Date(latestDate.getFullYear(), latestDate.getMonth() - i + 1, 0);

      const [monthIncome, monthExpense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: "income", date: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, type: "expense", date: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
        }),
      ]);

      const mIncome = Number(monthIncome._sum.amount) || 0;
      const mExpense = Number(monthExpense._sum.amount) || 0;

      monthlyTrend.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        fullMonth: monthStart.toLocaleString("default", { month: "long", year: "numeric" }),
        income: mIncome,
        expenses: mExpense,
        savings: mIncome - mExpense,
      });
    }

    // Top expenses (6 months)
    const topExpenses = await prisma.transaction.findMany({
      where: { userId, type: "expense", date: { gte: periodStartDate, lte: periodEndDate } },
      include: { category: true },
      orderBy: { amount: "desc" },
      take: 10,
    });

    // Budget progress (current month of the period)
    const currentMonthStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
    const currentMonthEnd = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0);

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const result = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: "expense",
            date: { gte: currentMonthStart, lte: currentMonthEnd },
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

    // Goals
    const goals = await prisma.goal.findMany({ where: { userId } });
    const goalProgress = goals.map((goal) => ({
      name: goal.name,
      target: Number(goal.targetAmount),
      current: Number(goal.currentAmount),
      progress: Number(goal.targetAmount) > 0
        ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
        : 0,
      color: goal.color || "#6366f1",
    }));

    const periodStartLabel = periodStartDate.toLocaleString("default", { month: "short", year: "numeric" });
    const periodEndLabel = latestDate.toLocaleString("default", { month: "short", year: "numeric" });

    return NextResponse.json({
      summary: {
        totalIncome: income,
        totalExpenses: expenses,
        totalSavings: savings,
        savingsRate,
        avgMonthlyIncome: Math.round(income / 6),
        avgMonthlyExpenses: Math.round(expenses / 6),
      },
      spendingByCategory: categorySpending,
      monthlyTrend,
      topExpenses: topExpenses.map((t) => ({
        description: t.description || "Expense",
        amount: Number(t.amount),
        category: t.category?.name || "Unknown",
        date: t.date,
      })),
      budgets: budgetsWithSpent,
      goals: goalProgress,
      periodLabel: `${periodStartLabel} - ${periodEndLabel}`,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
