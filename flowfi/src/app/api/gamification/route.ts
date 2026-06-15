import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureUserStats,
  seedAchievements,
  seedChallenges,
  assignDailyChallenges,
  assignWeeklyChallenges,
  calculateHealthScore,
  getSpendingAnalysis,
  getMotivationalMessage,
  xpForLevel,
  totalXpForLevel,
} from "@/lib/gamification";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await ensureUserStats(userId);
    await seedAchievements();
    await seedChallenges();

    const stats = await prisma.userStats.findUnique({ where: { userId } });
    if (!stats) {
      return NextResponse.json({ error: "Stats not found" }, { status: 404 });
    }

    const [userAchievements, dailyChallengeAssignments, weeklyChallengeAssignments, healthScore, analysis] = await Promise.all([
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { earnedAt: "desc" },
      }),
      assignDailyChallenges(userId),
      assignWeeklyChallenges(userId),
      calculateHealthScore(userId),
      getSpendingAnalysis(userId),
    ]);

    // Fetch challenge details for assigned challenges
    const dailyChallengeIds = dailyChallengeAssignments.map((uc) => uc.challengeId);
    const weeklyChallengeIds = weeklyChallengeAssignments.map((uc) => uc.challengeId);

    const [dailyChallengeDefs, weeklyChallengeDefs] = await Promise.all([
      prisma.challenge.findMany({ where: { id: { in: dailyChallengeIds } } }),
      prisma.challenge.findMany({ where: { id: { in: weeklyChallengeIds } } }),
    ]);

    const allAchievements = await prisma.achievement.findMany();

    const xpForNextLevel = xpForLevel(stats.level);
    const xpInCurrentLevel = stats.xp - totalXpForLevel(stats.level);
    const xpProgress = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);

    const motivationalMessage = getMotivationalMessage(
      { currentStreak: stats.currentStreak, level: stats.level, healthScore },
      analysis
    );

    const dailyChallenges = dailyChallengeAssignments.map((uc) => {
      const def = dailyChallengeDefs.find((c) => c.id === uc.challengeId);
      return {
        id: uc.id,
        key: def?.key || "",
        name: def?.name || "",
        description: def?.description || "",
        xpReward: def?.xpReward || 0,
        status: uc.status,
        progress: uc.progress,
      };
    });

    const weeklyChallenges = weeklyChallengeAssignments.map((uc) => {
      const def = weeklyChallengeDefs.find((c) => c.id === uc.challengeId);
      return {
        id: uc.id,
        key: def?.key || "",
        name: def?.name || "",
        description: def?.description || "",
        xpReward: def?.xpReward || 0,
        status: uc.status,
        progress: uc.progress,
      };
    });

    return NextResponse.json({
      stats: {
        xp: stats.xp,
        level: stats.level,
        xpForNextLevel,
        xpInCurrentLevel,
        xpProgress: Math.round(xpProgress),
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalTransactions: stats.totalTransactions,
        healthScore,
      },
      achievements: allAchievements.map((a) => ({
        ...a,
        earned: userAchievements.some((ua) => ua.achievementId === a.id),
        earnedAt: userAchievements.find((ua) => ua.achievementId === a.id)?.earnedAt || null,
      })),
      dailyChallenges,
      weeklyChallenges,
      analysis,
      motivationalMessage,
      recentAchievements: userAchievements.slice(0, 3).map((ua) => ({
        key: ua.achievement.key,
        name: ua.achievement.name,
        icon: ua.achievement.icon,
        earnedAt: ua.earnedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching gamification data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
