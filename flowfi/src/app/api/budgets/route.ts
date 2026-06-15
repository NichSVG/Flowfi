import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addXp, checkAchievements, XP_REWARDS, ensureUserStats } from "@/lib/gamification";

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

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    // Get all categories to build parent-child relationships
    const allCategories = await prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { isDefault: true },
        ],
      },
    });

    // Calculate spent amounts for each budget based on the appropriate period
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        let periodStart: Date;
        let periodEnd: Date;

        const startDate = new Date(budget.startDate);

        if (budget.period === "weekly") {
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
          // Monthly
          periodStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
          periodEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        }

        // Get the budget category and its subcategories
        const budgetCategoryId = budget.categoryId;
        const subcategoryIds = allCategories
          .filter(c => c.parentId === budgetCategoryId)
          .map(c => c.id);
        const allCategoryIds = [budgetCategoryId, ...subcategoryIds];

        // Query transactions for the budget category AND all its subcategories
        const result = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: { in: allCategoryIds },
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

    const currentMonthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
    const currentMonthIndex = monthsList.indexOf(currentMonthKey);

    return NextResponse.json({
      budgets: budgetsWithSpent,
      currentMonth: targetDate.toLocaleString("default", { month: "long", year: "numeric" }),
      currentMonthKey,
      availableMonths: monthsList,
      hasPrevMonth: currentMonthIndex > 0,
      hasNextMonth: currentMonthIndex < monthsList.length - 1,
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

    // Gamification: award XP
    try {
      await ensureUserStats(userId);
      await addXp(userId, XP_REWARDS.ADD_BUDGET, "budget:added");
      await checkAchievements(userId);
    } catch (e) {
      console.error("Gamification error (non-blocking):", e);
    }

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
