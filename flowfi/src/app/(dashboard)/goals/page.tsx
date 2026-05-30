"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X, Target, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock data
const mockGoals = [
  {
    id: 1,
    name: "Emergency Fund",
    description: "6 months of expenses",
    targetAmount: 15000,
    currentAmount: 8500,
    deadline: "2024-12-31",
    icon: "shield",
    color: "#22c55e",
  },
  {
    id: 2,
    name: "New Laptop",
    description: "MacBook Pro for work",
    targetAmount: 2500,
    currentAmount: 1800,
    deadline: "2024-06-30",
    icon: "laptop",
    color: "#3b82f6",
  },
  {
    id: 3,
    name: "Vacation",
    description: "Trip to Japan",
    targetAmount: 5000,
    currentAmount: 2200,
    deadline: "2024-09-15",
    icon: "plane",
    color: "#8b5cf6",
  },
  {
    id: 4,
    name: "Car Down Payment",
    description: "20% down payment",
    targetAmount: 8000,
    currentAmount: 3500,
    deadline: "2025-03-01",
    icon: "car",
    color: "#f59e0b",
  },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState(mockGoals);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<typeof mockGoals[0] | null>(null);
  const [addingFundsGoal, setAddingFundsGoal] = useState<typeof mockGoals[0] | null>(null);
  const [addAmount, setAddAmount] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    deadline: "",
  });

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAddGoal = () => {
    const newGoal = {
      id: Date.now(),
      name: formData.name,
      description: formData.description,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: 0,
      deadline: formData.deadline,
      icon: "target",
      color: "#6366f1",
    };
    setGoals([...goals, newGoal]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditGoal = () => {
    if (!editingGoal) return;
    const updatedGoals = goals.map((g) =>
      g.id === editingGoal.id
        ? {
            ...g,
            name: formData.name,
            description: formData.description,
            targetAmount: parseFloat(formData.targetAmount),
            deadline: formData.deadline,
          }
        : g
    );
    setGoals(updatedGoals);
    setEditingGoal(null);
    resetForm();
  };

  const handleDeleteGoal = (id: number) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const handleAddFunds = () => {
    if (!addingFundsGoal || !addAmount) return;
    const updatedGoals = goals.map((g) =>
      g.id === addingFundsGoal.id
        ? { ...g, currentAmount: g.currentAmount + parseFloat(addAmount) }
        : g
    );
    setGoals(updatedGoals);
    setAddingFundsGoal(null);
    setAddAmount("");
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", targetAmount: "", deadline: "" });
  };

  const openEditModal = (goal: typeof mockGoals[0]) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description,
      targetAmount: goal.targetAmount.toString(),
      deadline: goal.deadline,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Savings Goals</h1>
          <p className="text-muted-foreground">Track your progress towards financial goals</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {/* Overview */}
      <Card variant="bordered">
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Target</p>
              <p className="text-2xl font-bold">{formatCurrency(totalTarget)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Saved</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalSaved)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-2xl font-bold">{overallProgress.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Goals Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const percentage = getProgressPercentage(goal.currentAmount, goal.targetAmount);
          const daysRemaining = getDaysRemaining(goal.deadline);
          const isCompleted = goal.currentAmount >= goal.targetAmount;

          return (
            <Card key={goal.id} variant="bordered">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-lg p-2"
                      style={{ backgroundColor: `${goal.color}20` }}
                    >
                      <Target className="h-5 w-5" style={{ color: goal.color }} />
                    </div>
                    <div>
                      <h3 className="font-medium">{goal.name}</h3>
                      <p className="text-xs text-muted-foreground">{goal.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="rounded p-1 hover:bg-accent"
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="rounded p-1 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                    </span>
                    <span className="font-medium">{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {daysRemaining > 0 ? `${daysRemaining} days left` : "Overdue"}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(goal.targetAmount - goal.currentAmount)} to go
                  </div>
                </div>

                {isCompleted ? (
                  <div className="rounded-lg bg-success/10 p-2 text-center text-sm text-success">
                    Goal Completed!
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setAddingFundsGoal(goal)}
                  >
                    Add Funds
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Goal Modal */}
      {(showAddModal || editingGoal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingGoal ? "Edit Goal" : "Add Goal"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingGoal(null);
                  resetForm();
                }}
                className="rounded p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Goal Name"
                placeholder="e.g., Emergency Fund"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Input
                label="Description (optional)"
                placeholder="What is this goal for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Input
                label="Target Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              />

              <Input
                label="Deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingGoal(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={editingGoal ? handleEditGoal : handleAddGoal}
                  disabled={!formData.name || !formData.targetAmount}
                >
                  {editingGoal ? "Save Changes" : "Add Goal"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {addingFundsGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Funds</h2>
              <button
                onClick={() => {
                  setAddingFundsGoal(null);
                  setAddAmount("");
                }}
                className="rounded p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Adding funds to: <strong>{addingFundsGoal.name}</strong>
            </p>

            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
            />

            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setAddingFundsGoal(null);
                  setAddAmount("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddFunds}
                disabled={!addAmount || parseFloat(addAmount) <= 0}
              >
                Add Funds
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
