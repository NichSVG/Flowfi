"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock data
const mockBudgets = [
  { id: 1, category: "Food & Dining", budget: 500, spent: 385, color: "#ef4444" },
  { id: 2, category: "Transportation", budget: 300, spent: 220, color: "#3b82f6" },
  { id: 3, category: "Bills & Utilities", budget: 600, spent: 580, color: "#f59e0b" },
  { id: 4, category: "Entertainment", budget: 200, spent: 175, color: "#8b5cf6" },
  { id: 5, category: "Shopping", budget: 400, spent: 420, color: "#ec4899" },
  { id: 6, category: "Health", budget: 150, spent: 95, color: "#10b981" },
];

const categories = [
  "Food & Dining",
  "Transportation",
  "Bills & Utilities",
  "Entertainment",
  "Shopping",
  "Health",
  "Education",
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState(mockBudgets);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<typeof mockBudgets[0] | null>(null);

  const [formData, setFormData] = useState({
    category: "Food & Dining",
    budget: "",
    period: "monthly",
  });

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getProgressPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-warning";
    return "bg-success";
  };

  const handleAddBudget = () => {
    const newBudget = {
      id: Date.now(),
      category: formData.category,
      budget: parseFloat(formData.budget),
      spent: 0,
      color: "#6366f1",
    };
    setBudgets([...budgets, newBudget]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditBudget = () => {
    if (!editingBudget) return;
    const updatedBudgets = budgets.map((b) =>
      b.id === editingBudget.id
        ? { ...b, category: formData.category, budget: parseFloat(formData.budget) }
        : b
    );
    setBudgets(updatedBudgets);
    setEditingBudget(null);
    resetForm();
  };

  const handleDeleteBudget = (id: number) => {
    setBudgets(budgets.filter((b) => b.id !== id));
  };

  const resetForm = () => {
    setFormData({ category: "Food & Dining", budget: "", period: "monthly" });
  };

  const openEditModal = (budget: typeof mockBudgets[0]) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      budget: budget.budget.toString(),
      period: "monthly",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">Set spending limits for each category</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="bordered">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-2xl font-bold ${totalRemaining >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(totalRemaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const percentage = getProgressPercentage(budget.spent, budget.budget);
          const isOverBudget = budget.spent > budget.budget;

          return (
            <Card key={budget.id} variant="bordered">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: budget.color }}
                    />
                    <h3 className="font-medium">{budget.category}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="rounded p-1 hover:bg-accent"
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </button>
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
                    {formatCurrency(budget.spent)} of {formatCurrency(budget.budget)}
                  </span>
                  <span className={isOverBudget ? "text-destructive" : "text-muted-foreground"}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>

                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(budget.spent, budget.budget)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {isOverBudget && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Over budget by {formatCurrency(budget.spent - budget.budget)}
                  </div>
                )}

                {!isOverBudget && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(budget.budget - budget.spent)} remaining
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Budget Modal */}
      {(showAddModal || editingBudget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingBudget ? "Edit Budget" : "Add Budget"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingBudget(null);
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
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Budget Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
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
                    setEditingBudget(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={editingBudget ? handleEditBudget : handleAddBudget}
                  disabled={!formData.budget}
                >
                  {editingBudget ? "Save Changes" : "Add Budget"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
