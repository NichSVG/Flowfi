"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GamificationPanel } from "@/components/gamification-panel";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useCurrency } from "@/lib/use-currency";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  date: string;
  category: { name: string; color: string | null } | null;
}

interface CategoryTransaction {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  paymentMethod: string | null;
}

interface SpendingCategory {
  name: string;
  value: number;
  color: string;
  categoryId: string;
  transactionCount: number;
  transactions: CategoryTransaction[];
}

interface DashboardData {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  recentTransactions: Transaction[];
  spendingByCategory: SpendingCategory[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
  budgets: { name: string; budget: number; spent: number; color: string }[];
  goals: { name: string; target: number; current: number; progress: number; color: string }[];
  currentMonth: string;
  currentMonthKey: string;
  availableMonths: string[];
  hasPrevMonth: boolean;
  hasNextMonth: boolean;
}

const emptyData: DashboardData = {
  balance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  savingsRate: 0,
  recentTransactions: [],
  spendingByCategory: [],
  monthlyTrend: [],
  budgets: [],
  goals: [],
  currentMonth: "",
  currentMonthKey: "",
  availableMonths: [],
  hasPrevMonth: false,
  hasNextMonth: false,
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const { format } = useCurrency();

  const fetchDashboard = useCallback(async (month?: string) => {
    setLoading(true);
    try {
      const url = month ? `/api/dashboard?month=${month}` : "/api/dashboard";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setSelectedMonth(json.currentMonthKey);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const goToPrevMonth = () => {
    if (data.hasPrevMonth && data.availableMonths.length > 0) {
      const currentIndex = data.availableMonths.indexOf(data.currentMonthKey);
      if (currentIndex > 0) {
        const prevMonth = data.availableMonths[currentIndex - 1];
        fetchDashboard(prevMonth);
      }
    }
  };

  const goToNextMonth = () => {
    if (data.hasNextMonth && data.availableMonths.length > 0) {
      const currentIndex = data.availableMonths.indexOf(data.currentMonthKey);
      if (currentIndex < data.availableMonths.length - 1) {
        const nextMonth = data.availableMonths[currentIndex + 1];
        fetchDashboard(nextMonth);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevMonth}
              disabled={!data.hasPrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground font-medium">
              {data.currentMonth || "No data"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              disabled={!data.hasNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Link href="/transactions">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">{format(data.balance)}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="text-2xl font-bold text-success">
                  {format(data.monthlyIncome)}
                </p>
              </div>
              <div className="rounded-full bg-success/10 p-3">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                <p className="text-2xl font-bold text-destructive">
                  {format(data.monthlyExpenses)}
                </p>
              </div>
              <div className="rounded-full bg-destructive/10 p-3">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className="text-2xl font-bold">{data.savingsRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-full bg-warning/10 p-3">
                <PiggyBank className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="bordered" className={selectedCategoryName ? "lg:col-span-2" : "lg:col-span-2"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Spending by Category</CardTitle>
              {selectedCategoryName && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategoryName(null)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.spendingByCategory.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No spending data this month
              </div>
            ) : (
              <div className="grid gap-6" style={{ gridTemplateColumns: selectedCategoryName ? "1fr 1fr" : "1fr" }}>
                <div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.spendingByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          cursor="pointer"
                          onClick={(entry) => setSelectedCategoryName(entry.name === selectedCategoryName ? null : entry.name)}
                        >
                          {data.spendingByCategory.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              opacity={!selectedCategoryName || selectedCategoryName === entry.name ? 1 : 0.3}
                              stroke={selectedCategoryName === entry.name ? "#fff" : "transparent"}
                              strokeWidth={selectedCategoryName === entry.name ? 2 : 0}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => format(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {data.spendingByCategory.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => setSelectedCategoryName(selectedCategoryName === category.name ? null : category.name)}
                        className={`flex items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-accent ${
                          selectedCategoryName === category.name ? "bg-accent ring-1 ring-border" : ""
                        }`}
                      >
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                        <span className="text-xs text-muted-foreground truncate">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCategoryName && (() => {
                  const cat = data.spendingByCategory.find(c => c.name === selectedCategoryName);
                  if (!cat || cat.transactions.length === 0) {
                    return (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No transactions in this category
                      </div>
                    );
                  }
                  return (
                    <div className="h-[350px] overflow-y-auto space-y-2 pr-2">
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        {cat.name} — {format(cat.value)}
                      </p>
                      {cat.transactions.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-lg border border-border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{t.description || "Transaction"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(t.date).toLocaleDateString()}
                              {t.paymentMethod ? ` • ${t.paymentMethod}` : ""}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-destructive ml-4 shrink-0">
                            -{format(t.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlyTrend.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data yet. Add transactions to see trends.
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: number) => format(value)} />
                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gamification Panel */}
        <div className="lg:col-span-1 overflow-y-auto max-h-[600px]">
          <GamificationPanel />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Budget Overview</CardTitle>
              <Link href="/budgets">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.budgets.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No budgets set. <Link href="/budgets" className="text-primary hover:underline">Create one</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.budgets.map((budget) => {
                  const percentage = budget.budget > 0 ? Math.min((budget.spent / budget.budget) * 100, 100) : 0;
                  const isOver = budget.spent > budget.budget;
                  return (
                    <div key={budget.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: budget.color }} />
                          <span className="text-sm font-medium">{budget.name}</span>
                        </div>
                        <span className={`text-xs ${isOver ? "text-destructive" : "text-muted-foreground"}`}>
                          {format(budget.spent)} / {format(budget.budget)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : "bg-success"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Savings Goals</CardTitle>
              <Link href="/goals">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.goals.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No goals set. <Link href="/goals" className="text-primary hover:underline">Create one</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.goals.map((goal) => (
                  <div key={goal.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{goal.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(goal.current)} / {format(goal.target)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(goal.progress, 100)}%`, backgroundColor: goal.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No transactions this month
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-full p-2 ${
                        transaction.type === "income" ? "bg-success/10" : "bg-destructive/10"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description || "Transaction"}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category?.name || "Uncategorized"} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      transaction.type === "income" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {format(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
