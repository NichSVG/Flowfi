"use client";

import { useState } from "react";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

// Mock data
const spendingByCategory = [
  { name: "Food & Dining", value: 450, color: "#ef4444" },
  { name: "Transportation", value: 280, color: "#3b82f6" },
  { name: "Bills & Utilities", value: 520, color: "#f59e0b" },
  { name: "Entertainment", value: 180, color: "#8b5cf6" },
  { name: "Shopping", value: 320, color: "#ec4899" },
  { name: "Health", value: 150, color: "#10b981" },
  { name: "Education", value: 90, color: "#6366f1" },
];

const monthlyTrend = [
  { month: "Jul", income: 4800, expenses: 3200, savings: 1600 },
  { month: "Aug", income: 5100, expenses: 3400, savings: 1700 },
  { month: "Sep", income: 4900, expenses: 3100, savings: 1800 },
  { month: "Oct", income: 5300, expenses: 3600, savings: 1700 },
  { month: "Nov", income: 5000, expenses: 3800, savings: 1200 },
  { month: "Dec", income: 5200, expenses: 3450, savings: 1750 },
];

const weeklySpending = [
  { day: "Mon", amount: 45 },
  { day: "Tue", amount: 120 },
  { day: "Wed", amount: 85 },
  { day: "Thu", amount: 200 },
  { day: "Fri", amount: 150 },
  { day: "Sat", amount: 280 },
  { day: "Sun", amount: 90 },
];

const topExpenses = [
  { description: "Rent", amount: 1500, category: "Bills & Utilities" },
  { description: "Groceries", amount: 385, category: "Food & Dining" },
  { description: "Car Payment", amount: 350, category: "Transportation" },
  { description: "Dining Out", amount: 220, category: "Food & Dining" },
  { description: "Shopping", amount: 180, category: "Shopping" },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalIncome = monthlyTrend.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyTrend.reduce((sum, m) => sum + m.expenses, 0);
  const totalSavings = monthlyTrend.reduce((sum, m) => sum + m.savings, 0);
  const savingsRate = ((totalSavings / totalIncome) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Insights into your spending patterns</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1.5 text-sm ${
                timeRange === "week" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-3 py-1.5 text-sm ${
                timeRange === "month" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-3 py-1.5 text-sm ${
                timeRange === "year" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              Year
            </button>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSavings)}</p>
              </div>
              <PieChartIcon className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className="text-2xl font-bold">{savingsRate}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending by Category */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {spendingByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {spendingByCategory.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs text-muted-foreground">{category.name}</span>
                  </div>
                  <span className="text-xs font-medium">{formatCurrency(category.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Savings Trend */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Savings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Spending */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>This Week&apos;s Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySpending}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Expenses */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Top Expenses This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topExpenses.map((expense, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">{expense.category}</p>
                  </div>
                </div>
                <p className="font-semibold text-destructive">
                  {formatCurrency(expense.amount)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
