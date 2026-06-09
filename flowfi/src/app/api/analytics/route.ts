import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalIncome = await prisma.transaction.aggregate({
      where: { userId, type: "income", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });

    const totalExpenses = await prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });

    const monthlyIncome = Number(totalIncome._sum.amount) || 0;
    const monthlyExpenses = Number(totalExpenses._sum.amount) || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    const spendingByCategory = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "expense", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: spendingByCategory.map((s) => s.categoryId) } },
    });

    const categorySpending = spendingByCategory.map((item) => {
      const category = categories.find((c) => c.id === item.categoryId);
      return {
        name: category?.name || "Unknown",
        value: Number(item._sum.amount) || 0,
        color: category?.color || "#6b7280",
      };
    }).sort((a, b) => b.value - a.value);

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

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

      const income = Number(monthIncome._sum.amount) || 0;
      const expenses = Number(monthExpense._sum.amount) || 0;

      monthlyTrend.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        income,
        expenses,
        savings: income - expenses,
      });
    }

    const topExpenses = await prisma.transaction.findMany({
      where: { userId, type: "expense", date: { gte: startOfMonth, lte: endOfMonth } },
      include: { category: true },
      orderBy: { amount: "desc" },
      take: 5,
    });

    const weeklySpending = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTotal = await prisma.transaction.aggregate({
        where: { userId, type: "expense", date: { gte: dayStart, lt: dayEnd } },
        _sum: { amount: true },
      });

      weeklySpending.push({
        day: dayNames[dayStart.getDay()],
        amount: Number(dayTotal._sum.amount) || 0,
      });
    }

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
            date: { gte: budget.startDate, lte: now },
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
    });

    const goalProgress = goals.map((goal) => ({
      name: goal.name,
      target: Number(goal.targetAmount),
      current: Number(goal.currentAmount),
      progress: Number(goal.targetAmount) > 0
        ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
        : 0,
      color: goal.color || "#6366f1",
    }));

    return NextResponse.json({
      summary: {
        totalIncome: monthlyIncome,
        totalExpenses: monthlyExpenses,
        totalSavings: monthlySavings,
        savingsRate,
      },
      spendingByCategory: categorySpending,
      monthlyTrend,
      weeklySpending,
      topExpenses: topExpenses.map((t) => ({
        description: t.description || "Expense",
        amount: Number(t.amount),
        category: t.category?.name || "Unknown",
      })),
      budgets: budgetsWithSpent,
      goals: goalProgress,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
