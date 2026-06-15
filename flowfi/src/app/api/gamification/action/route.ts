import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addXp,
  updateStreak,
  checkAchievements,
  checkDailyChallenges,
  XP_REWARDS,
} from "@/lib/gamification";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { action } = body;

    let xpAmount = 0;
    let reason = "";

    switch (action) {
      case "add_transaction":
        xpAmount = XP_REWARDS.ADD_TRANSACTION;
        reason = "transaction:added";
        await prisma.userStats.update({
          where: { userId },
          data: { totalTransactions: { increment: 1 } },
        });
        break;
      case "add_income":
        xpAmount = XP_REWARDS.ADD_INCOME;
        reason = "income:added";
        await prisma.userStats.update({
          where: { userId },
          data: { totalTransactions: { increment: 1 } },
        });
        break;
      case "add_budget":
        xpAmount = XP_REWARDS.ADD_BUDGET;
        reason = "budget:added";
        break;
      case "add_goal":
        xpAmount = XP_REWARDS.ADD_GOAL;
        reason = "goal:added";
        break;
      case "review_report":
        xpAmount = XP_REWARDS.REVIEW_REPORT;
        reason = "report:reviewed";
        break;
      case "daily_login":
        xpAmount = XP_REWARDS.DAILY_LOGIN;
        reason = "login:daily";
        break;
      case "upload_receipt":
        xpAmount = XP_REWARDS.UPLOAD_RECEIPT;
        reason = "receipt:uploaded";
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const streakResult = await updateStreak(userId);
    if (streakResult.isNewStreak) {
      xpAmount += 5;
      reason += "+streak:updated";
    }

    const xpResult = await addXp(userId, xpAmount, reason);
    const newAchievements = await checkAchievements(userId);
    const completedChallenges = await checkDailyChallenges(userId);

    return NextResponse.json({
      xpAwarded: xpAmount,
      xp: xpResult.xp,
      level: xpResult.level,
      levelUp: xpResult.levelUp,
      streak: streakResult.currentStreak,
      newAchievements,
      completedChallenges,
    });
  } catch (error) {
    console.error("Error processing gamification action:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
