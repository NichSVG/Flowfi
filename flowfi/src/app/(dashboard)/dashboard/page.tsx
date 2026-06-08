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
import Link from "next/link";
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

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  date: string;
  category: { name: string; color: string | null } | null;
}

interface DashboardData {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  recentTransactions: Transaction[];
  spendingByCategory: { name: string; value: number; color: string }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
}

const emptyData: DashboardData = {
  balance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  savingsRate: 0,
  recentTransactions: [],
  spendingByCategory: [],
  monthlyTrend: [],
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
          <p className="text-muted-foreground">Welcome back! Here&apos;s your financial overview.</p>
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
                <p className="text-2xl font-bold">{formatCurrency(data.balance)}</p>
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
                  {formatCurrency(data.monthlyIncome)}
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
                  {formatCurrency(data.monthlyExpenses)}
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
                <p className="text-2xl font-bold">{data.savingsRate}%</p>
              </div>
              <div className="rounded-full bg-warning/10 p-3">
                <PiggyBank className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.spendingByCategory.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No spending data yet. Add transactions to see charts.
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
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {data.spendingByCategory.map((category) => (
                    <div key={category.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="text-xs text-muted-foreground">{category.name}</span>
                    </div>
                  ))}
                </div>
              </>
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
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
              No transactions yet. Start by adding one or importing a bank statement.
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
                    {formatCurrency(transaction.amount)}
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
