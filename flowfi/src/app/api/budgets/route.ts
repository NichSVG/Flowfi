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

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = budget.startDate;
        const now = new Date();
        
        const result = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: "expense",
            date: {
              gte: startDate,
              lte: now,
            },
          },
          _sum: { amount: true },
        });

        return {
          ...budget,
          spent: Number(result._sum.amount) || 0,
        };
      })
    );

    return NextResponse.json(budgetsWithSpent);
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
