"use client";

import { useState, useEffect } from "react";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Target, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useCurrency } from "@/lib/use-currency";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalSavings: number;
    savingsRate: number;
    avgMonthlyIncome: number;
    avgMonthlyExpenses: number;
  };
  spendingByCategory: { name: string; value: number; color: string }[];
  monthlyTrend: { month: string; fullMonth: string; income: number; expenses: number; savings: number }[];
  topExpenses: { description: string; amount: number; category: string; date: string }[];
  budgets: { name: string; budget: number; spent: number; color: string }[];
  goals: { name: string; target: number; current: number; progress: number; color: string }[];
  periodLabel: string;
}

export default function AnalyticsPage() {
  const { format } = useCurrency();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Failed to load analytics</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          {data.periodLabel ? `6-Month Overview: ${data.periodLabel}` : "Insights into your spending patterns"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income (6mo)</p>
                <p className="text-2xl font-bold text-success">{format(data.summary.totalIncome)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {format(data.summary.avgMonthlyIncome)}/mo
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses (6mo)</p>
                <p className="text-2xl font-bold text-destructive">{format(data.summary.totalExpenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {format(data.summary.avgMonthlyExpenses)}/mo
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Savings (6mo)</p>
                <p className={`text-2xl font-bold ${data.summary.totalSavings >= 0 ? "text-success" : "text-destructive"}`}>
                  {format(data.summary.totalSavings)}
                </p>
              </div>
              <PiggyBank className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Savings Rate</p>
                <p className="text-2xl font-bold">{data.summary.savingsRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Spending by Category (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.spendingByCategory.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No spending data in this period
              </div>
            ) : (
              <>
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
                      >
                        {data.spendingByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => format(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {data.spendingByCategory.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="text-xs text-muted-foreground">{category.name}</span>
                      </div>
                      <span className="text-xs font-medium">{format(category.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Income vs Expenses (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value: number) => format(value)} />
                  <Legend />
                  <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Savings Trend (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value: number) => format(value)} />
                  <Line type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Top Expenses (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topExpenses.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No expenses in this period
              </div>
            ) : (
              <div className="space-y-3">
                {data.topExpenses.slice(0, 5).map((expense, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{expense.category}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-destructive">{format(expense.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Budget Progress (Current Month)</CardTitle>
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
              <CardTitle>Goal Progress</CardTitle>
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
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" style={{ color: goal.color }} />
                        <span className="text-sm font-medium">{goal.name}</span>
                      </div>
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
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {data.monthlyTrend.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Month</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Income</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Expenses</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyTrend.map((month) => (
                    <tr key={month.month} className="border-b border-border/50">
                      <td className="py-3 px-2 font-medium">{month.fullMonth}</td>
                      <td className="py-3 px-2 text-right text-success">{format(month.income)}</td>
                      <td className="py-3 px-2 text-right text-destructive">{format(month.expenses)}</td>
                      <td className={`py-3 px-2 text-right font-medium ${month.savings >= 0 ? "text-success" : "text-destructive"}`}>
                        {format(month.savings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
