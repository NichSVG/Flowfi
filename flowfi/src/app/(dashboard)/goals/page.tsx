"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Target, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/lib/use-currency";

interface Goal {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  icon: string | null;
  color: string | null;
  status: string;
}

interface GoalsResponse {
  goals: Goal[];
  summary: {
    totalSaved: number;
    totalGoalTarget: number;
    totalGoalCurrent: number;
    unallocatedSavings: number;
  };
}

export default function GoalsPage() {
  const { format } = useCurrency();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingFundsGoal, setAddingFundsGoal] = useState<Goal | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [savingsSummary, setSavingsSummary] = useState({
    totalSaved: 0,
    totalGoalTarget: 0,
    totalGoalCurrent: 0,
    unallocatedSavings: 0,
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    deadline: "",
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const data: GoalsResponse = await res.json();
        setGoals(Array.isArray(data.goals) ? data.goals : []);
        setSavingsSummary(data.summary || {
          totalSaved: 0,
          totalGoalTarget: 0,
          totalGoalCurrent: 0,
          unallocatedSavings: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const getProgressPercentage = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleAddGoal = async () => {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          targetAmount: parseFloat(formData.targetAmount),
          deadline: formData.deadline || null,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchGoals();
      }
    } catch (error) {
      console.error("Failed to add goal:", error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGoals(goals.filter((g) => g.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  const handleAddFunds = async () => {
    if (!addingFundsGoal || !addAmount) return;

    try {
      const res = await fetch(`/api/goals/${addingFundsGoal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentAmount: Number(addingFundsGoal.currentAmount) + parseFloat(addAmount),
        }),
      });

      if (res.ok) {
        setAddingFundsGoal(null);
        setAddAmount("");
        fetchGoals();
      }
    } catch (error) {
      console.error("Failed to add funds:", error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", targetAmount: "", deadline: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <Card variant="bordered">
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Saved (from transactions)</p>
              <p className="text-2xl font-bold text-success">{format(savingsSummary.totalSaved)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Allocated to Goals</p>
              <p className="text-2xl font-bold">{format(totalSaved)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unallocated Savings</p>
              <p className="text-2xl font-bold text-primary">{format(savingsSummary.unallocatedSavings)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Goal Progress</p>
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

      {goals.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="py-12 text-center text-muted-foreground">
            No savings goals yet. Create one to start tracking your progress.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const percentage = getProgressPercentage(Number(goal.currentAmount), Number(goal.targetAmount));
            const daysRemaining = getDaysRemaining(goal.deadline);
            const isCompleted = Number(goal.currentAmount) >= Number(goal.targetAmount);

            return (
              <Card key={goal.id} variant="bordered">
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-lg p-2"
                        style={{ backgroundColor: `${goal.color || "#6366f1"}20` }}
                      >
                        <Target className="h-5 w-5" style={{ color: goal.color || "#6366f1" }} />
                      </div>
                      <div>
                        <h3 className="font-medium">{goal.name}</h3>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground">{goal.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="rounded p-1 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(Number(goal.currentAmount))} of {format(Number(goal.targetAmount))}
                      </span>
                      <span className="font-medium">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: goal.color || "#6366f1",
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {daysRemaining !== null
                        ? daysRemaining > 0
                          ? `${daysRemaining} days left`
                          : "Overdue"
                        : "No deadline"}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {format(Number(goal.targetAmount) - Number(goal.currentAmount))} to go
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
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Goal</h2>
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
                label="Deadline (optional)"
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
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddGoal}
                  disabled={!formData.name || !formData.targetAmount}
                >
                  Add Goal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
