import { prisma } from "./prisma";

// ── XP & LEVEL SYSTEM ──────────────────────────────────────────────────────
export const XP_REWARDS = {
  ADD_TRANSACTION: 10,
  ADD_INCOME: 10,
  ADD_BUDGET: 15,
  ADD_GOAL: 15,
  REVIEW_REPORT: 20,
  COMPLETE_CHALLENGE: 30,
  EARN_ACHIEVEMENT: 50,
  DAILY_LOGIN: 5,
  UPLOAD_RECEIPT: 10,
  SET_CATEGORY: 5,
} as const;

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export async function addXp(userId: string, amount: number, reason: string) {
  const stats = await prisma.userStats.upsert({
    where: { userId },
    create: { userId, xp: amount, level: 1 },
    update: { xp: { increment: amount } },
  });

  const newXp = stats.xp;
  let newLevel = stats.level;
  let xpNeeded = xpForLevel(newLevel);

  while (newXp >= totalXpForLevel(newLevel) + xpNeeded) {
    newLevel++;
    xpNeeded = xpForLevel(newLevel);
  }

  if (newLevel !== stats.level) {
    await prisma.userStats.update({
      where: { userId },
      data: { level: newLevel },
    });
  }

  return { xp: newXp, level: newLevel, levelUp: newLevel > stats.level };
}

// ── STREAK SYSTEM ──────────────────────────────────────────────────────────
export async function updateStreak(userId: string) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) return { currentStreak: 0, isNewStreak: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = stats.lastActiveDate ? new Date(stats.lastActiveDate) : null;
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = stats.currentStreak;
  let isNewStreak = false;

  if (!lastActive || lastActive.getTime() < yesterday.getTime()) {
    newStreak = 1;
    isNewStreak = true;
  } else if (lastActive.getTime() === yesterday.getTime()) {
    newStreak = stats.currentStreak + 1;
    isNewStreak = true;
  } else if (lastActive.getTime() === today.getTime()) {
    return { currentStreak: stats.currentStreak, isNewStreak: false };
  }

  const longestStreak = Math.max(stats.longestStreak, newStreak);

  await prisma.userStats.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastActiveDate: today,
    },
  });

  return { currentStreak: newStreak, isNewStreak, longestStreak };
}

// ── ACHIEVEMENTS ───────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { key: "first_transaction", name: "First Step", description: "Log your first transaction", icon: "footprints", xpReward: 25, category: "milestone", requirement: { type: "transactions", value: 1 } },
  { key: "ten_transactions", name: "Getting Started", description: "Log 10 transactions", icon: "trending-up", xpReward: 50, category: "transaction", requirement: { type: "transactions", value: 10 } },
  { key: "fifty_transactions", name: "Dedicated Tracker", description: "Log 50 transactions", icon: "flame", xpReward: 100, category: "transaction", requirement: { type: "transactions", value: 50 } },
  { key: "hundred_transactions", name: "Century Club", description: "Log 100 transactions", icon: "trophy", xpReward: 200, category: "transaction", requirement: { type: "transactions", value: 100 } },
  { key: "streak_3", name: "Consistent", description: "Maintain a 3-day streak", icon: "calendar-check", xpReward: 30, category: "streak", requirement: { type: "streak", value: 3 } },
  { key: "streak_7", name: "Week Warrior", description: "Maintain a 7-day streak", icon: "calendar-days", xpReward: 75, category: "streak", requirement: { type: "streak", value: 7 } },
  { key: "streak_30", name: "Monthly Master", description: "Maintain a 30-day streak", icon: "calendar-range", xpReward: 200, category: "streak", requirement: { type: "streak", value: 30 } },
  { key: "streak_100", name: "Unstoppable", description: "Maintain a 100-day streak", icon: "zap", xpReward: 500, category: "streak", requirement: { type: "streak", value: 100 } },
  { key: "first_budget", name: "Budget Boss", description: "Create your first budget", icon: "wallet", xpReward: 25, category: "budget", requirement: { type: "budgets", value: 1 } },
  { key: "under_budget", name: "Under Budget", description: "Stay under all budgets for a month", icon: "shield-check", xpReward: 100, category: "budget", requirement: { type: "under_budget", value: 1 } },
  { key: "first_goal", name: "Goal Setter", description: "Create your first savings goal", icon: "target", xpReward: 25, category: "savings", requirement: { type: "goals", value: 1 } },
  { key: "goal_reached", name: "Goal Crusher", description: "Complete a savings goal", icon: "award", xpReward: 150, category: "savings", requirement: { type: "goals_completed", value: 1 } },
  { key: "saver_50k", name: "Saver", description: "Save Rp 50,000 in a month", icon: "piggy-bank", xpReward: 50, category: "savings", requirement: { type: "monthly_savings", value: 50000 } },
  { key: "saver_500k", name: "Super Saver", description: "Save Rp 500,000 in a month", icon: "banknote", xpReward: 150, category: "savings", requirement: { type: "monthly_savings", value: 500000 } },
  { key: "level_5", name: "Rising Star", description: "Reach level 5", icon: "star", xpReward: 50, category: "milestone", requirement: { type: "level", value: 5 } },
  { key: "level_10", name: "Finance Pro", description: "Reach level 10", icon: "gem", xpReward: 100, category: "milestone", requirement: { type: "level", value: 10 } },
  { key: "health_80", name: "Healthy Finances", description: "Achieve a health score of 80+", icon: "heart-pulse", xpReward: 100, category: "milestone", requirement: { type: "health_score", value: 80 } },
];

export async function seedAchievements() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      create: achievement,
      update: achievement,
    });
  }
}

export async function checkAchievements(userId: string) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) return [];

  const existingAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  });
  const existingKeys = new Set(existingAchievements.map((a) => a.achievement.key));

  const earned: Array<{ key: string; name: string; xpReward: number }> = [];

  for (const achievement of ACHIEVEMENTS) {
    if (existingKeys.has(achievement.key)) continue;

    const req = achievement.requirement as { type: string; value: number };
    let earned_it = false;

    switch (req.type) {
      case "transactions":
        earned_it = stats.totalTransactions >= req.value;
        break;
      case "streak":
        earned_it = stats.currentStreak >= req.value || stats.longestStreak >= req.value;
        break;
      case "level":
        earned_it = stats.level >= req.value;
        break;
      case "health_score":
        earned_it = stats.healthScore >= req.value;
        break;
      case "goals_completed": {
        const completedGoals = await prisma.goal.count({
          where: { userId, status: "completed" },
        });
        earned_it = completedGoals >= req.value;
        break;
      }
      case "goals": {
        const goalCount = await prisma.goal.count({ where: { userId } });
        earned_it = goalCount >= req.value;
        break;
      }
      case "budgets": {
        const budgetCount = await prisma.budget.count({ where: { userId } });
        earned_it = budgetCount >= req.value;
        break;
      }
      case "under_budget": {
        earned_it = await checkUnderBudget(userId);
        break;
      }
      case "monthly_savings": {
        earned_it = await checkMonthlySavings(userId, req.value);
        break;
      }
    }

    if (earned_it) {
      const dbAchievement = await prisma.achievement.findUnique({
        where: { key: achievement.key },
      });
      if (dbAchievement) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: dbAchievement.id },
        });
        await addXp(userId, achievement.xpReward, `achievement:${achievement.key}`);
        earned.push({ key: achievement.key, name: achievement.name, xpReward: achievement.xpReward });
      }
    }
  }

  return earned;
}

async function checkUnderBudget(userId: string): Promise<boolean> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
  });

  if (budgets.length === 0) return false;

  for (const budget of budgets) {
    const spent = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: budget.categoryId,
        type: "expense",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });
    if (Number(spent._sum.amount) > Number(budget.amount)) return false;
  }

  return true;
}

async function checkMonthlySavings(userId: string, target: number): Promise<boolean> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [income, expenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "income", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  const savings = Number(income._sum.amount || 0) - Number(expenses._sum.amount || 0);
  return savings >= target;
}

// ── CHALLENGES ─────────────────────────────────────────────────────────────
export const DAILY_CHALLENGES = [
  { key: "no_spend_day", name: "No Spend Day", description: "Don't make any expense transactions today", type: "daily", xpReward: 30, requirement: { type: "no_spend_day" } },
  { key: "log_3_transactions", name: "Active Logger", description: "Log at least 3 transactions today", type: "daily", xpReward: 20, requirement: { type: "log_transactions", value: 3 } },
  { key: "save_50k", name: "Save Rp 50,000", description: "Save at least Rp 50,000 today (income > expenses by 50k)", type: "daily", xpReward: 25, requirement: { type: "daily_save", value: 50000 } },
  { key: "categorize_all", name: "Categorize Everything", description: "Make sure all today's transactions have proper categories", type: "daily", xpReward: 15, requirement: { type: "categorize_all" } },
];

export const WEEKLY_CHALLENGES = [
  { key: "under_budget_week", name: "Budget Keeper", description: "Stay under budget this week", type: "weekly", xpReward: 50, requirement: { type: "weekly_under_budget" } },
  { key: "log_every_day", name: "Daily Logger", description: "Log at least one transaction every day this week", type: "weekly", xpReward: 40, requirement: { type: "log_every_day" } },
  { key: "reduce_spending", name: "Spend Less", description: "Spend 10% less than last week", type: "weekly", xpReward: 45, requirement: { type: "reduce_spending", value: 0.1 } },
  { key: "review_analytics", name: "Data Reviewer", description: "Check your analytics page at least once this week", type: "weekly", xpReward: 20, requirement: { type: "review_analytics" } },
];

export async function seedChallenges() {
  for (const challenge of [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES]) {
    await prisma.challenge.upsert({
      where: { key: challenge.key },
      create: challenge,
      update: challenge,
    });
  }
}

export async function assignDailyChallenges(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.userChallenge.findMany({
    where: { userId, targetDate: today, challenge: { type: "daily" } },
  });

  if (existing.length > 0) return existing;

  const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 2);

  const created = [];
  for (const challengeDef of selected) {
    const challenge = await prisma.challenge.findUnique({
      where: { key: challengeDef.key },
    });
    if (challenge) {
      const uc = await prisma.userChallenge.create({
        data: { userId, challengeId: challenge.id, targetDate: today },
        include: { challenge: true },
      });
      created.push(uc);
    }
  }

  return created;
}

export async function assignWeeklyChallenges(userId: string) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const existing = await prisma.userChallenge.findMany({
    where: { userId, targetDate: startOfWeek, challenge: { type: "weekly" } },
  });

  if (existing.length > 0) return existing;

  const shuffled = [...WEEKLY_CHALLENGES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 2);

  const created = [];
  for (const challengeDef of selected) {
    const challenge = await prisma.challenge.findUnique({
      where: { key: challengeDef.key },
    });
    if (challenge) {
      const uc = await prisma.userChallenge.create({
        data: { userId, challengeId: challenge.id, targetDate: startOfWeek },
        include: { challenge: true },
      });
      created.push(uc);
    }
  }

  return created;
}

export async function checkDailyChallenges(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const activeChallenges = await prisma.userChallenge.findMany({
    where: { userId, targetDate: today, status: "active" },
    include: { challenge: true },
  });

  const completed: Array<{ key: string; name: string; xpReward: number }> = [];

  for (const uc of activeChallenges) {
    const req = uc.challenge.requirement as { type: string; value?: number };
    let isComplete = false;

    switch (req.type) {
      case "no_spend_day": {
        const expenses = await prisma.transaction.count({
          where: { userId, type: "expense", date: { gte: today, lt: tomorrow } },
        });
        isComplete = expenses === 0;
        break;
      }
      case "log_transactions": {
        const count = await prisma.transaction.count({
          where: { userId, date: { gte: today, lt: tomorrow } },
        });
        isComplete = count >= (req.value || 3);
        break;
      }
      case "daily_save": {
        const [income, expenses] = await Promise.all([
          prisma.transaction.aggregate({
            where: { userId, type: "income", date: { gte: today, lt: tomorrow } },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: { userId, type: "expense", date: { gte: today, lt: tomorrow } },
            _sum: { amount: true },
          }),
        ]);
        const saved = Number(income._sum.amount || 0) - Number(expenses._sum.amount || 0);
        isComplete = saved >= (req.value || 50000);
        break;
      }
      case "categorize_all": {
        const misc = await prisma.transaction.count({
          where: {
            userId,
            date: { gte: today, lt: tomorrow },
            category: { name: "Miscellaneous" },
          },
        });
        const total = await prisma.transaction.count({
          where: { userId, date: { gte: today, lt: tomorrow } },
        });
        isComplete = total > 0 && misc === 0;
        break;
      }
    }

    if (isComplete) {
      await prisma.userChallenge.update({
        where: { id: uc.id },
        data: { status: "completed", completedAt: new Date(), progress: 100 },
      });
      await addXp(userId, uc.challenge.xpReward, `challenge:${uc.challenge.key}`);
      completed.push({
        key: uc.challenge.key,
        name: uc.challenge.name,
        xpReward: uc.challenge.xpReward,
      });
    }
  }

  return completed;
}

// ── FINANCIAL HEALTH SCORE ─────────────────────────────────────────────────
export async function calculateHealthScore(userId: string): Promise<number> {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) return 0;

  let score = 0;

  // Consistency (30 points) - based on streak
  const streakScore = Math.min(stats.currentStreak / 30, 1) * 30;
  score += streakScore;

  // Budgeting (30 points) - budgets created and staying under budget
  const budgetCount = await prisma.budget.count({ where: { userId } });
  const budgetScore = Math.min(budgetCount / 3, 1) * 15;
  score += budgetScore;

  const underBudget = await checkUnderBudget(userId);
  score += underBudget ? 15 : 0;

  // Savings (25 points) - savings rate
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [income, expenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "income", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  const monthlyIncome = Number(income._sum.amount || 0);
  const monthlyExpenses = Number(expenses._sum.amount || 0);
  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
  const savingsScore = Math.min(Math.max(savingsRate, 0), 1) * 25;
  score += savingsScore;

  // Tracking (15 points) - transaction count
  const trackingScore = Math.min(stats.totalTransactions / 50, 1) * 15;
  score += trackingScore;

  const finalScore = Math.round(score);

  await prisma.userStats.update({
    where: { userId },
    data: { healthScore: finalScore },
  });

  return finalScore;
}

// ── SPENDING ANALYSIS ──────────────────────────────────────────────────────
export async function getSpendingAnalysis(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [thisMonthExpenses, lastMonthExpenses, categorySpending, dailySpending] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "expense", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.transaction.groupBy({
      by: ["date"],
      where: { userId, type: "expense", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  const categories = await prisma.category.findMany({
    where: { id: { in: categorySpending.map((s) => s.categoryId) } },
  });

  const thisTotal = Number(thisMonthExpenses._sum.amount || 0);
  const lastTotal = Number(lastMonthExpenses._sum.amount || 0);
  const changePercent = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

  const topCategory = categorySpending[0];
  const topCategoryName = topCategory
    ? categories.find((c) => c.id === topCategory.categoryId)?.name || "Unknown"
    : "None";

  const mostExpensiveDay = dailySpending[0];
  const mostExpensiveDayAmount = mostExpensiveDay
    ? Number(mostExpensiveDay._sum.amount)
    : 0;

  return {
    thisMonthTotal: thisTotal,
    lastMonthTotal: lastTotal,
    changePercent: Math.round(changePercent),
    topCategory: topCategoryName,
    topCategoryAmount: topCategory ? Number(topCategory._sum.amount) : 0,
    mostExpensiveDay: mostExpensiveDay?.date || null,
    mostExpensiveDayAmount,
    isDecreasing: thisTotal < lastTotal,
  };
}

// ── MOTIVATIONAL MESSAGES ──────────────────────────────────────────────────
export function getMotivationalMessage(stats: { currentStreak: number; level: number; healthScore: number }, analysis: { changePercent: number; isDecreasing: boolean; topCategory: string }): string {
  const messages: string[] = [];

  if (stats.currentStreak >= 7) {
    messages.push(`🔥 Amazing ${stats.currentStreak}-day streak! You're building great habits.`);
  } else if (stats.currentStreak >= 3) {
    messages.push(`💪 ${stats.currentStreak} days in a row! Keep the momentum going.`);
  } else if (stats.currentStreak === 1) {
    messages.push(`🌱 Welcome back! Every day of tracking counts.`);
  }

  if (analysis.isDecreasing && analysis.changePercent < -10) {
    messages.push(`📉 Great job! Your spending decreased by ${Math.abs(analysis.changePercent)}% compared to last month.`);
  } else if (analysis.isDecreasing) {
    messages.push(`👍 You're spending less than last month. Keep it up!`);
  } else if (analysis.changePercent > 20) {
    messages.push(`⚠️ Your spending increased by ${analysis.changePercent}% from last month. Consider reviewing your ${analysis.topCategory} expenses.`);
  }

  if (stats.healthScore >= 80) {
    messages.push(`💚 Your financial health score is ${stats.healthScore}/100 — Excellent!`);
  } else if (stats.healthScore >= 60) {
    messages.push(`💛 Your health score is ${stats.healthScore}/100 — Good progress!`);
  } else if (stats.healthScore > 0) {
    messages.push(`🧡 Your health score is ${stats.healthScore}/100 — There's room to improve.`);
  }

  if (messages.length === 0) {
    messages.push(`📊 Keep tracking your expenses to unlock insights and build healthy habits!`);
  }

  return messages[0];
}

// ── INIT USER STATS ────────────────────────────────────────────────────────
export async function ensureUserStats(userId: string) {
  await prisma.userStats.upsert({
    where: { userId },
    create: { userId, xp: 0, level: 1, currentStreak: 0, longestStreak: 0, totalTransactions: 0, healthScore: 0 },
    update: {},
  });
}
