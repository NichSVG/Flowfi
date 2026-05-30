"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
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
} from "recharts";

// Mock data - replace with real data from API
const mockData = {
  balance: 12580.50,
  monthlyIncome: 5200.00,
  monthlyExpenses: 3450.75,
  savingsRate: 33.6,
  recentTransactions: [
    { id: 1, description: "Grocery Store", amount: -85.50, category: "Food & Dining", date: "2024-01-15", type: "expense" },
    { id: 2, description: "Monthly Salary", amount: 5200.00, category: "Salary", date: "2024-01-15", type: "income" },
    { id: 3, description: "Electric Bill", amount: -120.00, category: "Bills & Utilities", date: "2024-01-14", type: "expense" },
    { id: 4, description: "Freelance Work", amount: 850.00, category: "Freelance", date: "2024-01-13", type: "income" },
    { id: 5, description: "Restaurant", amount: -45.00, category: "Food & Dining", date: "2024-01-13", type: "expense" },
  ],
  spendingByCategory: [
    { name: "Food & Dining", value: 450, color: "#ef4444" },
    { name: "Transportation", value: 280, color: "#3b82f6" },
    { name: "Bills & Utilities", value: 520, color: "#f59e0b" },
    { name: "Entertainment", value: 180, color: "#8b5cf6" },
    { name: "Shopping", value: 320, color: "#ec4899" },
    { name: "Health", value: 150, color: "#10b981" },
  ],
  monthlyTrend: [
    { month: "Aug", income: 4800, expenses: 3200 },
    { month: "Sep", income: 5100, expenses: 3400 },
    { month: "Oct", income: 4900, expenses: 3100 },
    { month: "Nov", income: 5300, expenses: 3600 },
    { month: "Dec", income: 5000, expenses: 3800 },
    { month: "Jan", income: 5200, expenses: 3450 },
  ],
};

export default function DashboardPage() {
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(false);

  // In production, fetch data from API
  useEffect(() => {
    // fetchDashboardData().then(setData);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your financial overview.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Balance */}
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(data.balance)}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Income */}
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(data.monthlyIncome)}
                </p>
              </div>
              <div className="rounded-full bg-success/10 p-3">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(data.monthlyExpenses)}
                </p>
              </div>
              <div className="rounded-full bg-destructive/10 p-3">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className="text-2xl font-bold">{data.savingsRate}%</p>
              </div>
              <div className="rounded-full bg-warning/10 p-3">
                <PiggyBank className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
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
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {data.spendingByCategory.map((category) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card variant="bordered">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-full p-2 ${
                      transaction.type === "income"
                        ? "bg-success/10"
                        : "bg-destructive/10"
                    }`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category} • {transaction.date}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-semibold ${
                    transaction.type === "income"
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {transaction.type === "income" ? "+" : ""}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
