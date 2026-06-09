import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Find the most recent transaction to determine the current period
    const latestTransaction = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    const targetDate = latestTransaction ? new Date(latestTransaction.date) : new Date();

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    // Calculate spent amounts for each budget based on the appropriate period
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        let periodStart: Date;
        let periodEnd: Date;

        const startDate = new Date(budget.startDate);

        if (budget.period === "weekly") {
          // Find the week containing targetDate that starts on or after startDate
          const daysDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const weeksDiff = Math.floor(daysDiff / 7);
          periodStart = new Date(startDate);
          periodStart.setDate(periodStart.getDate() + weeksDiff * 7);
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + 6);
        } else if (budget.period === "yearly") {
          periodStart = new Date(targetDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          if (periodStart > targetDate) {
            periodStart.setFullYear(periodStart.getFullYear() - 1);
          }
          periodEnd = new Date(periodStart);
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          periodEnd.setDate(periodEnd.getDate() - 1);
        } else {
          // Monthly - find the month containing targetDate
          periodStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
          periodEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        }

        const result = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: "expense",
            date: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
          _sum: { amount: true },
        });

        return {
          ...budget,
          spent: Number(result._sum.amount) || 0,
          currentPeriodStart: periodStart.toISOString(),
          currentPeriodEnd: periodEnd.toISOString(),
        };
      })
    );

    return NextResponse.json({
      budgets: budgetsWithSpent,
      currentMonth: targetDate.toLocaleString("default", { month: "long", year: "numeric" }),
    });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { amount, period, categoryId, startDate } = body;

    if (!amount || !categoryId) {
      return NextResponse.json(
        { error: "Amount and category are required" },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.create({
      data: {
        amount: parseFloat(amount),
        period: period || "monthly",
        startDate: startDate ? new Date(startDate) : new Date(),
        userId,
        categoryId,
      },
      include: { category: true },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
