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

    // Get monthly income
    const incomeResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "income",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    // Get monthly expenses
    const expenseResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "expense",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
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
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    const categories = await prisma.category.findMany({
      where: {
        id: { in: spendingByCategory.map((s) => s.categoryId) },
      },
    });

    const categorySpending = spendingByCategory.map((item) => {
      const category = categories.find((c) => c.id === item.categoryId);
      return {
        name: category?.name || "Unknown",
        value: Number(item._sum.amount) || 0,
        color: category?.color || "#6b7280",
      };
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 5,
    });

    // Get monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

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

    return NextResponse.json({
      balance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      spendingByCategory: categorySpending,
      recentTransactions,
      monthlyTrend,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
