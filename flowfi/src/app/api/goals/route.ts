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

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total savings from transactions
    const totalIncome = await prisma.transaction.aggregate({
      where: { userId, type: "income" },
      _sum: { amount: true },
    });

    const totalExpenses = await prisma.transaction.aggregate({
      where: { userId, type: "expense" },
      _sum: { amount: true },
    });

    const totalSaved = Number(totalIncome._sum.amount || 0) - Number(totalExpenses._sum.amount || 0);
    const totalGoalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const totalGoalCurrent = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);

    return NextResponse.json({
      goals,
      summary: {
        totalSaved: Math.max(0, totalSaved),
        totalGoalTarget,
        totalGoalCurrent,
        unallocatedSavings: Math.max(0, totalSaved - totalGoalCurrent),
      },
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
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

    const body = await req.json();
    const { name, description, targetAmount, deadline, icon, color } = body;

    if (!name || !targetAmount) {
      return NextResponse.json(
        { error: "Name and target amount are required" },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        name,
        description,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline ? new Date(deadline) : null,
        icon,
        color,
        userId: session.user.id,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
