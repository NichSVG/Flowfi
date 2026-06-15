"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/lib/use-currency";

interface Category {
  id: string;
  name: string;
  color: string | null;
  type: string;
}

interface Budget {
  id: string;
  amount: number;
  period: string;
  startDate: string;
  categoryId: string;
  category: { name: string; color: string | null } | null;
  spent: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface BudgetsResponse {
  budgets: Budget[];
  currentMonth: string;
  currentMonthKey: string;
  availableMonths: string[];
  hasPrevMonth: boolean;
  hasNextMonth: boolean;
}

export default function BudgetsPage() {
  const { format } = useCurrency();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [currentMonth, setCurrentMonth] = useState("");
  const [currentMonthKey, setCurrentMonthKey] = useState("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [hasPrevMonth, setHasPrevMonth] = useState(false);
  const [hasNextMonth, setHasNextMonth] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    period: "monthly",
  });

  useEffect(() => {
    fetchData(selectedMonth || undefined);
  }, [selectedMonth]);

  async function fetchData(month?: string) {
    try {
      const url = month ? `/api/budgets?month=${month}` : "/api/budgets";
      const [budgetsRes, catsRes] = await Promise.all([
        fetch(url),
        fetch("/api/categories?type=expense"),
      ]);

      if (budgetsRes.ok) {
        const data: BudgetsResponse = await budgetsRes.json();
        setBudgets(Array.isArray(data.budgets) ? data.budgets : []);
        setCurrentMonth(data.currentMonth || "");
        setCurrentMonthKey(data.currentMonthKey || "");
        setAvailableMonths(data.availableMonths || []);
        setHasPrevMonth(data.hasPrevMonth || false);
        setHasNextMonth(data.hasNextMonth || false);
      }

      if (catsRes.ok) {
        const data = await catsRes.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0);
  const totalRemaining = totalBudget - totalSpent;

  const getProgressPercentage = (spent: number, budget: number) => {
    return budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-warning";
    return "bg-success";
  };

  const goToPrevMonth = () => {
    if (hasPrevMonth && availableMonths.length > 0) {
      const currentIndex = availableMonths.indexOf(currentMonthKey);
      if (currentIndex > 0) {
        setSelectedMonth(availableMonths[currentIndex - 1]);
      }
    }
  };

  const goToNextMonth = () => {
    if (hasNextMonth && availableMonths.length > 0) {
      const currentIndex = availableMonths.indexOf(currentMonthKey);
      if (currentIndex < availableMonths.length - 1) {
        setSelectedMonth(availableMonths[currentIndex + 1]);
      }
    }
  };

  const handleAddBudget = async () => {
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: formData.categoryId,
          amount: parseFloat(formData.amount),
          period: formData.period,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchData(selectedMonth || undefined);
      }
    } catch (error) {
      console.error("Failed to add budget:", error);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBudgets(budgets.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete budget:", error);
    }
  };

  const resetForm = () => {
    setFormData({ categoryId: "", amount: "", period: "monthly" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading budgets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevMonth}
              disabled={!hasPrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground font-medium">
              {currentMonth || "No data"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              disabled={!hasNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="bordered">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold">{format(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold text-destructive">{format(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-2xl font-bold ${totalRemaining >= 0 ? "text-success" : "text-destructive"}`}>
              {format(totalRemaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {budgets.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="py-12 text-center text-muted-foreground">
            No budgets yet. Create one to start tracking your spending limits.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = getProgressPercentage(budget.spent, Number(budget.amount));
            const isOverBudget = budget.spent > Number(budget.amount);

            return (
              <Card key={budget.id} variant="bordered">
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: budget.category?.color || "#6b7280" }}
                      />
                      <h3 className="font-medium">{budget.category?.name || "Unknown"}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="rounded p-1 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {format(budget.spent)} of {format(Number(budget.amount))}
                    </span>
                    <span className={isOverBudget ? "text-destructive" : "text-muted-foreground"}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(budget.spent, Number(budget.amount))}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {isOverBudget && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      Over budget by {format(budget.spent - Number(budget.amount))}
                    </div>
                  )}

                  {!isOverBudget && (
                    <p className="text-xs text-muted-foreground">
                      {format(Number(budget.amount) - budget.spent)} remaining
                    </p>
                  )}

                  <p className="mt-2 text-xs text-muted-foreground">
                    {budget.period === "monthly" ? "Monthly" : budget.period === "weekly" ? "Weekly" : "Yearly"} budget
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Budget</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="rounded p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Budget Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />

              <div>
                <label className="mb-2 block text-sm font-medium">Period</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddBudget}
                  disabled={!formData.categoryId || !formData.amount}
                >
                  Add Budget
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
