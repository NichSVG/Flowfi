"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Target, Wallet, TrendingUp, PiggyBank, ArrowRight, ArrowLeft, Check, Sparkles, Plus, Trash2, Calendar } from "lucide-react";

const STEPS = [
  { title: "Welcome to FlowFi", subtitle: "Let's personalize your experience" },
  { title: "Monthly Income", subtitle: "Enter your average monthly income" },
  { title: "Set Up Budgets", subtitle: "Allocate spending limits using the 50/30/20 rule" },
  { title: "Savings Goals", subtitle: "What are you saving for?" },
  { title: "Review & Finish", subtitle: "Check your financial plan" },
];

// Budget categories with conservative recommendations (total ~60% of income)
// Uses 50/30/20 principle: 50% needs, 30% wants, 20% savings
// We only budget for needs+wants (~60%), leaving 40% for savings & buffer
const BUDGET_CATEGORIES = [
  { key: "housing", label: "Housing", emoji: "🏠", color: "#6366f1", recommendPct: 15, type: "need" },
  { key: "food", label: "Food & Dining", emoji: "🍔", color: "#ef4444", recommendPct: 15, type: "need" },
  { key: "transport", label: "Transportation", emoji: "🚗", color: "#3b82f6", recommendPct: 8, type: "need" },
  { key: "bills", label: "Bills & Subscriptions", emoji: "📱", color: "#d946ef", recommendPct: 8, type: "need" },
  { key: "shopping", label: "Shopping", emoji: "🛍️", color: "#ec4899", recommendPct: 5, type: "want" },
  { key: "entertainment", label: "Entertainment", emoji: "🎮", color: "#8b5cf6", recommendPct: 5, type: "want" },
  { key: "health", label: "Healthcare", emoji: "💊", color: "#10b981", recommendPct: 3, type: "need" },
  { key: "education", label: "Education", emoji: "📚", color: "#f59e0b", recommendPct: 2, type: "want" },
];

const GOAL_PRESETS = [
  { name: "Emergency Fund", icon: "🛡️", color: "#10b981", suggestMultiplier: 3, description: "3 months of expenses" },
  { name: "Vacation", icon: "✈️", color: "#06b6d4", suggestMultiplier: 1, description: "1 month of income" },
  { name: "New Phone/Laptop", icon: "💻", color: "#8b5cf6", suggestMultiplier: 0.5, description: "Half month of income" },
  { name: "Education Fund", icon: "🎓", color: "#f59e0b", suggestMultiplier: 2, description: "2 months of expenses" },
  { name: "Investment Starter", icon: "📈", color: "#ec4899", suggestMultiplier: 1, description: "1 month of income" },
];

function formatNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, "");
  if (!num) return "";
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseFormattedNumber(value: string): number {
  return parseInt(value.replace(/\./g, "")) || 0;
}

interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: string;
  deadline: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [budgets, setBudgets] = useState<Record<string, { enabled: boolean; amount: string }>>({});
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsTarget, setSavingsTarget] = useState(20);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated") {
      fetch("/api/onboarding").then(res => res.json()).then(data => {
        if (data.onboarding?.completed) {
          router.push("/dashboard");
        }
      }).catch(() => {});
    }
  }, [status, router]);

  // Initialize budgets when income changes
  useEffect(() => {
    const incomeNum = parseFormattedNumber(monthlyIncome);
    if (incomeNum > 0 && Object.keys(budgets).length === 0) {
      const initial: Record<string, { enabled: boolean; amount: string }> = {};
      BUDGET_CATEGORIES.forEach(cat => {
        const recommended = Math.round(incomeNum * (cat.recommendPct / 100));
        // Round to nearest 50000 for cleaner numbers
        const rounded = Math.round(recommended / 50000) * 50000;
        // Enable Food & Dining by default, others disabled
        initial[cat.key] = { enabled: cat.key === "food", amount: formatNumber(String(rounded)) };
      });
      setBudgets(initial);
    }
  }, [monthlyIncome, budgets]);

  const toggleBudget = (key: string) => {
    setBudgets(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const updateBudgetAmount = (key: string, value: string) => {
    const formatted = formatNumber(value);
    setBudgets(prev => ({
      ...prev,
      [key]: { ...prev[key], amount: formatted },
    }));
  };

  const applyRecommendation = (key: string) => {
    const incomeNum = parseFormattedNumber(monthlyIncome);
    const cat = BUDGET_CATEGORIES.find(c => c.key === key);
    if (incomeNum > 0 && cat) {
      const recommended = Math.round(incomeNum * (cat.recommendPct / 100));
      const rounded = Math.round(recommended / 50000) * 50000;
      setBudgets(prev => ({
        ...prev,
        [key]: { ...prev[key], amount: formatNumber(String(rounded)) },
      }));
    }
  };

  const applyAllRecommendations = () => {
    const incomeNum = parseFormattedNumber(monthlyIncome);
    if (incomeNum <= 0) return;
    const newBudgets: Record<string, { enabled: boolean; amount: string }> = {};
    BUDGET_CATEGORIES.forEach(cat => {
      const recommended = Math.round(incomeNum * (cat.recommendPct / 100));
      const rounded = Math.round(recommended / 50000) * 50000;
      newBudgets[cat.key] = { enabled: true, amount: formatNumber(String(rounded)) };
    });
    setBudgets(newBudgets);
  };

  const addGoal = (preset?: typeof GOAL_PRESETS[0]) => {
    const incomeNum = parseFormattedNumber(monthlyIncome);
    const newGoal: SavingsGoal = {
      id: Date.now().toString(),
      name: preset?.name || "",
      icon: preset?.icon || "🎯",
      color: preset?.color || "#6366f1",
      targetAmount: preset ? formatNumber(String(Math.round(incomeNum * preset.suggestMultiplier))) : "",
      deadline: "",
    };
    setSavingsGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, field: keyof SavingsGoal, value: string) => {
    setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const removeGoal = (id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleComplete = async () => {
    setLoading(true);
    try {
      const incomeNum = parseFormattedNumber(monthlyIncome);
      const enabledBudgets = Object.entries(budgets)
        .filter(([_, v]) => v.enabled && parseFormattedNumber(v.amount) > 0)
        .map(([key, v]) => {
          const cat = BUDGET_CATEGORIES.find(c => c.key === key);
          return {
            categoryKey: key,
            categoryName: cat?.label || key,
            amount: parseFormattedNumber(v.amount),
          };
        });

      const goalsData = savingsGoals
        .filter(g => g.name && parseFormattedNumber(g.targetAmount) > 0)
        .map(g => ({
          name: g.name,
          icon: g.icon,
          color: g.color,
          targetAmount: parseFormattedNumber(g.targetAmount),
          deadline: g.deadline || null,
        }));

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialGoals: [],
          monthlyIncome: incomeNum,
          budgets: enabledBudgets,
          savingsGoals: goalsData,
          savingsTarget,
        }),
      });

      if (res.ok) {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Onboarding failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return parseFormattedNumber(monthlyIncome) > 0;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  const incomeNum = parseFormattedNumber(monthlyIncome);
  const enabledBudgets = Object.entries(budgets).filter(([_, v]) => v.enabled);
  const totalBudgetAmount = enabledBudgets.reduce((sum, [_, b]) => sum + parseFormattedNumber(b.amount), 0);
  const totalBudgetPct = incomeNum > 0 ? Math.round((totalBudgetAmount / incomeNum) * 100) : 0;
  const remainingAfterBudget = incomeNum - totalBudgetAmount;
  const savingsAmount = Math.round(incomeNum * (savingsTarget / 100));
  const totalNeedsPct = BUDGET_CATEGORIES.filter(c => c.type === "need").reduce((sum, c) => sum + c.recommendPct, 0);
  const totalWantsPct = BUDGET_CATEGORIES.filter(c => c.type === "want").reduce((sum, c) => sum + c.recommendPct, 0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-6 sm:mb-8 flex gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-8 shadow-lg">
          <h1 className="text-xl sm:text-2xl font-bold">{STEPS[step].title}</h1>
          <p className="mt-1 text-muted-foreground">{STEPS[step].subtitle}</p>

          <div className="mt-6 min-h-[320px]">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Wallet className="h-12 w-12 text-primary" />
                </div>
                <p className="text-lg text-muted-foreground">
                  FlowFi helps you track expenses, set budgets, and achieve your financial goals.
                  Let&apos;s set up your profile in a few quick steps.
                </p>
                <div className="rounded-lg border border-border p-4 text-left w-full max-w-sm">
                  <p className="text-sm font-medium mb-2">We&apos;ll set up:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Your monthly income</li>
                    <li>• Budget allocations using 50/30/20 rule</li>
                    <li>• Savings goals with targets</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 1: Monthly Income */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Income (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={monthlyIncome}
                      onChange={(e) => {
                        setMonthlyIncome(formatNumber(e.target.value));
                        setBudgets({}); // Reset budgets when income changes
                      }}
                      placeholder="5.000.000"
                      className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-lg font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {incomeNum > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Rp {monthlyIncome} per month = Rp {formatNumber(String(incomeNum * 12))} per year
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium mb-3">Quick Select</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: "Rp 3.000.000", value: "3000000" },
                      { label: "Rp 5.000.000", value: "5000000" },
                      { label: "Rp 10.000.000", value: "10000000" },
                      { label: "Rp 15.000.000", value: "15000000" },
                      { label: "Rp 20.000.000", value: "20000000" },
                      { label: "Rp 25.000.000", value: "25000000" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setMonthlyIncome(formatNumber(opt.value));
                          setBudgets({});
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                          parseFormattedNumber(monthlyIncome) === parseInt(opt.value)
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Budget Setup */}
            {step === 2 && (
              <div className="space-y-4">
                {/* 50/30/20 Explanation */}
                <div className="rounded-lg bg-primary/5 p-3">
                  <p className="text-sm font-medium mb-2">50/30/20 Budgeting Rule</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-background p-2">
                      <p className="text-lg font-bold text-primary">50%</p>
                      <p className="text-xs text-muted-foreground">Needs</p>
                    </div>
                    <div className="rounded-lg bg-background p-2">
                      <p className="text-lg font-bold text-warning">30%</p>
                      <p className="text-xs text-muted-foreground">Wants</p>
                    </div>
                    <div className="rounded-lg bg-background p-2">
                      <p className="text-lg font-bold text-success">20%</p>
                      <p className="text-xs text-muted-foreground">Savings</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    We recommend budgeting ~60% of income. The remaining {100 - totalBudgetPct}% is for savings & buffer.
                  </p>
                </div>

                {/* Summary Bar */}
                <div className="rounded-lg border border-border p-3">
                  <div className="flex justify-between gap-2 text-sm mb-2">
                    <span className="text-muted-foreground">Budgeted</span>
                    <span className="font-medium shrink-0">{totalBudgetPct}% of income</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(totalBudgetPct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between gap-2 text-xs text-muted-foreground mt-1">
                    <span className="min-w-0 truncate">Rp {formatNumber(String(totalBudgetAmount))} budgeted</span>
                    <span className="text-success shrink-0">Rp {formatNumber(String(remainingAfterBudget))} remaining</span>
                  </div>
                </div>

                {/* Apply All Button */}
                <button
                  onClick={applyAllRecommendations}
                  className="flex items-center gap-2 w-full rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm font-medium text-primary hover:bg-primary/10 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Apply All Recommendations
                </button>

                {/* Category List */}
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {/* Needs */}
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Needs (~{totalNeedsPct}%)</p>
                  {BUDGET_CATEGORIES.filter(c => c.type === "need").map((cat) => {
                    const budget = budgets[cat.key];
                    if (!budget) return null;
                    return (
                      <BudgetCategoryCard
                        key={cat.key}
                        cat={cat}
                        budget={budget}
                        incomeNum={incomeNum}
                        onToggle={() => toggleBudget(cat.key)}
                        onChangeAmount={(v) => updateBudgetAmount(cat.key, v)}
                        onApplyRecommendation={() => applyRecommendation(cat.key)}
                      />
                    );
                  })}

                  {/* Wants */}
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-3">Wants (~{totalWantsPct}%)</p>
                  {BUDGET_CATEGORIES.filter(c => c.type === "want").map((cat) => {
                    const budget = budgets[cat.key];
                    if (!budget) return null;
                    return (
                      <BudgetCategoryCard
                        key={cat.key}
                        cat={cat}
                        budget={budget}
                        incomeNum={incomeNum}
                        onToggle={() => toggleBudget(cat.key)}
                        onChangeAmount={(v) => updateBudgetAmount(cat.key, v)}
                        onApplyRecommendation={() => applyRecommendation(cat.key)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Savings Goals */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-success/5 p-3">
                  <p className="text-sm font-medium">
                    With {savingsTarget}% savings rate, you could save{" "}
                    <span className="text-success font-bold">Rp {formatNumber(String(savingsAmount))}</span> per month
                  </p>
                </div>

                {/* Goal Presets */}
                <div>
                  <p className="text-sm font-medium mb-2">Quick Add Goals</p>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => addGoal(preset)}
                        className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/50 transition-all"
                      >
                        <span>{preset.icon}</span>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Goal */}
                <button
                  onClick={() => addGoal()}
                  className="flex items-center gap-2 w-full rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Goal
                </button>

                {/* Goals List */}
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {savingsGoals.map((goal) => (
                    <div key={goal.id} className="rounded-lg border border-border p-3 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-lg shrink-0">{goal.icon}</span>
                          <input
                            type="text"
                            value={goal.name}
                            onChange={(e) => updateGoal(goal.id, "name", e.target.value)}
                            placeholder="Goal name"
                            className="font-medium text-sm bg-transparent border-none outline-none w-full min-w-0"
                          />
                        </div>
                        <button onClick={() => removeGoal(goal.id)} aria-label="Remove goal" className="shrink-0 rounded p-2 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Target Amount</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">Rp</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={goal.targetAmount}
                              onChange={(e) => updateGoal(goal.id, "targetAmount", formatNumber(e.target.value))}
                              placeholder="0"
                              className="w-full rounded border border-border bg-background py-1.5 pl-7 pr-2 text-sm focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Deadline</label>
                          <input
                            type="date"
                            value={goal.deadline}
                            onChange={(e) => updateGoal(goal.id, "deadline", e.target.value)}
                            className="w-full rounded border border-border bg-background py-1.5 px-2 text-xs sm:text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                      {parseFormattedNumber(goal.targetAmount) > 0 && savingsAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {Math.ceil(parseFormattedNumber(goal.targetAmount) / savingsAmount)} months to reach this goal
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {savingsGoals.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Add savings goals to track your progress. You can skip this and add them later.
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                {/* Income Summary */}
                <div className="rounded-lg bg-primary/5 p-4">
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="text-2xl font-bold">Rp {monthlyIncome}</p>
                </div>

                {/* Budget Summary */}
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium mb-3">Budget Allocations</p>
                  {enabledBudgets.length > 0 ? (
                    <div className="space-y-2">
                      {enabledBudgets.map(([key, budget]) => {
                        const cat = BUDGET_CATEGORIES.find(c => c.key === key);
                        if (!cat) return null;
                        return (
                          <div key={key} className="flex items-center justify-between gap-2 text-sm">
                            <span className="flex items-center gap-2 min-w-0">
                              <span>{cat.emoji}</span>
                              <span className="truncate">{cat.label}</span>
                            </span>
                            <span className="font-medium shrink-0">Rp {budget.amount}</span>
                          </div>
                        );
                      })}
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between gap-2 text-sm font-medium">
                        <span>Total Budgeted</span>
                        <span className="shrink-0 text-right">{totalBudgetPct}% = Rp {formatNumber(String(totalBudgetAmount))}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No budgets set</p>
                  )}
                </div>

                {/* Savings Summary */}
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium mb-3">Savings Plan</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Savings ({savingsTarget}%)</span>
                    <span className="font-medium text-success">Rp {formatNumber(String(savingsAmount))}</span>
                  </div>
                  {savingsGoals.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {savingsGoals.filter(g => g.name).map((goal) => (
                        <div key={goal.id} className="flex justify-between gap-2 text-sm">
                          <span className="flex items-center gap-1 min-w-0">
                            <span>{goal.icon}</span>
                            <span className="truncate">{goal.name}</span>
                          </span>
                          <span className="text-muted-foreground shrink-0">Rp {goal.targetAmount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Remaining */}
                <div className={`rounded-lg p-4 ${remainingAfterBudget - savingsAmount >= 0 ? "bg-success/5" : "bg-warning/5"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Unallocated Buffer</p>
                      <p className="text-xs text-muted-foreground">For unexpected expenses & flexibility</p>
                    </div>
                    <p className="text-lg font-bold">
                      Rp {formatNumber(String(Math.max(0, incomeNum - totalBudgetAmount - savingsAmount)))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Setting up..." : "Get Started"}
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Budget Category Card Component
function BudgetCategoryCard({
  cat,
  budget,
  incomeNum,
  onToggle,
  onChangeAmount,
  onApplyRecommendation,
}: {
  cat: typeof BUDGET_CATEGORIES[0];
  budget: { enabled: boolean; amount: string };
  incomeNum: number;
  onToggle: () => void;
  onChangeAmount: (value: string) => void;
  onApplyRecommendation: () => void;
}) {
  const recommended = Math.round(incomeNum * (cat.recommendPct / 100));
  const roundedRecommended = Math.round(recommended / 50000) * 50000;

  return (
    <div
      className={`rounded-lg border-2 p-3 transition-all ${
        budget.enabled ? "border-primary/50 bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{cat.emoji}</span>
          <span className="font-medium text-sm">{cat.label}</span>
          <span className="text-xs text-muted-foreground">({cat.recommendPct}%)</span>
        </div>
        <button
          onClick={onToggle}
          aria-label={budget.enabled ? "Disable budget" : "Enable budget"}
          className={`shrink-0 rounded-full p-2 ${
            budget.enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <Check className="h-3 w-3" />
        </button>
      </div>

      {budget.enabled && (
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={budget.amount}
              onChange={(e) => onChangeAmount(e.target.value)}
              className="w-full rounded border border-border bg-background py-1.5 pl-7 pr-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={onApplyRecommendation}
            className="flex items-center gap-1 text-xs text-primary hover:underline break-words"
          >
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>Recommended: Rp {formatNumber(String(roundedRecommended))}</span>
          </button>
        </div>
      )}
    </div>
  );
}
