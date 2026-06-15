import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureUserStats, seedAchievements, seedChallenges, assignDailyChallenges, assignWeeklyChallenges } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ onboarding });
  } catch (error) {
    console.error("Error fetching onboarding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const { financialGoals, monthlyIncome, budgets, savingsGoals, savingsTarget } = body;

    // Save onboarding data
    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        financialGoals,
        monthlyIncome: String(monthlyIncome),
        savingsTarget,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        financialGoals,
        monthlyIncome: String(monthlyIncome),
        savingsTarget,
        completed: true,
        completedAt: new Date(),
      },
    });

    // Create budgets if provided
    if (Array.isArray(budgets) && budgets.length > 0) {
      // Get user's own categories first, then defaults
      const userCategories = await prisma.category.findMany({
        where: {
          userId,
          type: "expense",
          parentId: null,
        },
      });

      const defaultCategories = await prisma.category.findMany({
        where: {
          isDefault: true,
          userId: { not: userId },
          type: "expense",
          parentId: null,
        },
      });

      for (const budget of budgets) {
        // Prioritize user's own categories over defaults
        const category = userCategories.find(
          c => c.name.toLowerCase() === budget.categoryName.toLowerCase()
        ) || defaultCategories.find(
          c => c.name.toLowerCase() === budget.categoryName.toLowerCase()
        );

        if (category) {
          await prisma.budget.upsert({
            where: {
              userId_categoryId_period: {
                userId,
                categoryId: category.id,
                period: "monthly",
              },
            },
            create: {
              userId,
              categoryId: category.id,
              amount: budget.amount,
              period: "monthly",
              startDate: new Date(),
            },
            update: {
              amount: budget.amount,
            },
          });
        }
      }
    }

    // Create savings goals if provided
    if (Array.isArray(savingsGoals) && savingsGoals.length > 0) {
      for (const goal of savingsGoals) {
        await prisma.goal.create({
          data: {
            userId,
            name: goal.name,
            icon: goal.icon || "🎯",
            color: goal.color || "#6366f1",
            targetAmount: goal.targetAmount,
            deadline: goal.deadline ? new Date(goal.deadline) : null,
            status: "active",
          },
        });
      }
    }

    // Initialize gamification
    await ensureUserStats(userId);
    await seedAchievements();
    await seedChallenges();
    await assignDailyChallenges(userId);
    await assignWeeklyChallenges(userId);

    return NextResponse.json({ onboarding, message: "Onboarding completed!" });
  } catch (error) {
    console.error("Error saving onboarding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
