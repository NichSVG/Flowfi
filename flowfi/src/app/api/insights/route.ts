import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSpendingAnalysis, calculateHealthScore } from "@/lib/gamification";

interface SpendingAnalysis {
  thisMonthTotal: number;
  lastMonthTotal: number;
  changePercent: number;
  topCategory: string;
  topCategoryAmount: number;
  mostExpensiveDay: Date | null;
  mostExpensiveDayAmount: number;
  isDecreasing: boolean;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [insights, analysis, healthScore] = await Promise.all([
      prisma.financialInsight.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      getSpendingAnalysis(userId),
      calculateHealthScore(userId),
    ]);

    const generatedInsights = generateInsights(analysis, healthScore);

    return NextResponse.json({
      insights,
      generatedInsights,
      analysis,
      healthScore,
    });
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateInsights(analysis: SpendingAnalysis, healthScore: number) {
  const insights: Array<{ type: string; title: string; message: string; priority: string }> = [];

  if (analysis.changePercent > 20) {
    insights.push({
      type: "overspending",
      title: "Spending Increased",
      message: `Your spending is up ${analysis.changePercent}% from last month. Your biggest category is ${analysis.topCategory} at Rp ${analysis.topCategoryAmount.toLocaleString("id-ID")}. Consider setting a budget for this category.`,
      priority: "high",
    });
  }

  if (analysis.changePercent < -10) {
    insights.push({
      type: "achievement",
      title: "Spending Decreased!",
      message: `Great job! You spent ${Math.abs(analysis.changePercent)}% less than last month. Keep up the good work!`,
      priority: "positive",
    });
  }

  if (analysis.mostExpensiveDayAmount > analysis.thisMonthTotal * 0.3) {
    insights.push({
      type: "trend",
      title: "High Spending Day Detected",
      message: `Your most expensive day this month was Rp ${analysis.mostExpensiveDayAmount.toLocaleString("id-ID")}, which is ${Math.round((analysis.mostExpensiveDayAmount / analysis.thisMonthTotal) * 100)}% of your total spending. Try to spread out large purchases.`,
      priority: "medium",
    });
  }

  if (healthScore < 50) {
    insights.push({
      type: "saving_tip",
      title: "Improve Your Financial Health",
      message: `Your health score is ${healthScore}/100. Try logging transactions daily, creating budgets, and setting savings goals to improve your score.`,
      priority: "medium",
    });
  }

  if (analysis.topCategory && analysis.topCategoryAmount > 0) {
    insights.push({
      type: "trend",
      title: `Top Category: ${analysis.topCategory}`,
      message: `You've spent Rp ${analysis.topCategoryAmount.toLocaleString("id-ID")} on ${analysis.topCategory} this month. This is your biggest expense category.`,
      priority: "info",
    });
  }

  return insights;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { type, title, message, data } = body;

    const insight = await prisma.financialInsight.create({
      data: { userId, type, title, message, data },
    });

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Error creating insight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
