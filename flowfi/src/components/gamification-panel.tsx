"use client";

import { useState, useEffect } from "react";
import {
  Flame, Star, Trophy, Target, Zap, Heart, TrendingUp, TrendingDown,
  ChevronRight, Award, Calendar, CheckCircle2, Lock, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GamificationData {
  stats: {
    xp: number;
    level: number;
    xpForNextLevel: number;
    xpInCurrentLevel: number;
    xpProgress: number;
    currentStreak: number;
    longestStreak: number;
    totalTransactions: number;
    healthScore: number;
  };
  achievements: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    xpReward: number;
    category: string;
    earned: boolean;
    earnedAt: string | null;
  }>;
  dailyChallenges: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    xpReward: number;
    status: string;
    progress: number;
  }>;
  weeklyChallenges: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    xpReward: number;
    status: string;
    progress: number;
  }>;
  analysis: {
    thisMonthTotal: number;
    lastMonthTotal: number;
    changePercent: number;
    topCategory: string;
    topCategoryAmount: number;
    isDecreasing: boolean;
  };
  motivationalMessage: string;
  recentAchievements: Array<{
    key: string;
    name: string;
    icon: string;
    earnedAt: string;
  }>;
}

const iconMap: Record<string, React.ElementType> = {
  footprints: Target,
  "trending-up": TrendingUp,
  flame: Flame,
  trophy: Trophy,
  "calendar-check": Calendar,
  "calendar-days": Calendar,
  "calendar-range": Calendar,
  zap: Zap,
  wallet: Target,
  "shield-check": CheckCircle2,
  target: Target,
  award: Award,
  "piggy-bank": Target,
  banknote: Target,
  star: Star,
  gem: Sparkles,
  "heart-pulse": Heart,
};

function getIcon(iconName: string) {
  return iconMap[iconName] || Trophy;
}

function formatXp(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}

export function GamificationPanel() {
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/gamification");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch gamification data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <Card variant="bordered">
        <CardContent className="py-6 text-center text-muted-foreground">
          Loading your progress...
        </CardContent>
      </Card>
    );
  }

  const { stats } = data;
  const earnedCount = data.achievements.filter((a) => a.earned).length;

  return (
    <div className="space-y-4">
      {/* Motivational Message */}
      <Card variant="bordered" className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-sm font-medium">{data.motivationalMessage}</p>
        </CardContent>
      </Card>

      {/* Streak + Level Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Streak */}
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-500/10 p-3">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">
                  Day Streak {stats.currentStreak > 0 && "🔥"}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Best: {stats.longestStreak} days
            </p>
          </CardContent>
        </Card>

        {/* Level & XP */}
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">Lv. {stats.level}</p>
                <p className="text-xs text-muted-foreground">
                  {formatXp(stats.xpInCurrentLevel)} / {formatXp(stats.xpForNextLevel)} XP
                </p>
              </div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${stats.xpProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Score */}
      <Card variant="bordered">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-3 ${
                stats.healthScore >= 80 ? "bg-success/10" :
                stats.healthScore >= 60 ? "bg-warning/10" :
                "bg-destructive/10"
              }`}>
                <Heart className={`h-6 w-6 ${
                  stats.healthScore >= 80 ? "text-success" :
                  stats.healthScore >= 60 ? "text-warning" :
                  "text-destructive"
                }`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.healthScore}/100</p>
                <p className="text-xs text-muted-foreground">Financial Health Score</p>
              </div>
            </div>
            <div className={`text-sm font-medium ${
              stats.healthScore >= 80 ? "text-success" :
              stats.healthScore >= 60 ? "text-warning" :
              "text-destructive"
            }`}>
              {stats.healthScore >= 80 ? "Excellent" :
               stats.healthScore >= 60 ? "Good" :
               stats.healthScore >= 40 ? "Fair" : "Needs Work"}
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                stats.healthScore >= 80 ? "bg-success" :
                stats.healthScore >= 60 ? "bg-warning" :
                "bg-destructive"
              }`}
              style={{ width: `${stats.healthScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Challenges */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Challenges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.dailyChallenges.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">TODAY</p>
              {data.dailyChallenges.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3 mb-2">
                  <div className="flex items-center gap-3">
                    {c.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${c.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {c.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-primary">+{c.xpReward} XP</span>
                </div>
              ))}
            </div>
          )}
          {data.weeklyChallenges.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">THIS WEEK</p>
              {data.weeklyChallenges.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3 mb-2">
                  <div className="flex items-center gap-3">
                    {c.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${c.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {c.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-primary">+{c.xpReward} XP</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spending Insight */}
      {data.analysis.topCategory && (
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {data.analysis.isDecreasing ? (
                <TrendingDown className="h-5 w-5 text-success" />
              ) : (
                <TrendingUp className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {data.analysis.isDecreasing ? "Spending Down" : "Spending Up"}{" "}
                  {Math.abs(data.analysis.changePercent)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Top category: {data.analysis.topCategory}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Achievements */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Achievements
            </div>
            <span className="text-xs font-normal text-muted-foreground">
              {earnedCount}/{data.achievements.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {(showAllAchievements ? data.achievements : data.achievements.slice(0, 6)).map((a) => {
              const Icon = getIcon(a.icon);
              return (
                <div
                  key={a.id}
                  className={`flex flex-col items-center gap-1 rounded-lg p-3 text-center ${
                    a.earned ? "bg-primary/5" : "opacity-40"
                  }`}
                  title={a.description}
                >
                  {a.earned ? (
                    <Icon className="h-6 w-6 text-primary" />
                  ) : (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  )}
                  <p className="text-[10px] font-medium leading-tight">{a.name}</p>
                  {a.earned && <p className="text-[10px] text-primary">+{a.xpReward} XP</p>}
                </div>
              );
            })}
          </div>
          {data.achievements.length > 6 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setShowAllAchievements(!showAllAchievements)}
            >
              {showAllAchievements ? "Show Less" : `Show All ${data.achievements.length}`}
              <ChevronRight className={`ml-1 h-4 w-4 transition-transform ${showAllAchievements ? "rotate-90" : ""}`} />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
