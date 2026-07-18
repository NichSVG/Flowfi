"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CATEGORY_KEYWORDS } from "@/lib/category-keywords";
import { extractMerchantName } from "@/lib/merchant-search";
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
  ChevronDown,
  CheckSquare,
  Square,
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

interface Category {
  id: string;
  name: string;
  color: string | null;
  type: string;
  parentId: string | null;
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [changingCategory, setChangingCategory] = useState<string | null>(null);
  const [bulkApplyPrompt, setBulkApplyPrompt] = useState<{
    transactionId: string;
    newCategoryId: string;
    newCategoryName: string;
    matchIds: string[];
    matchCount: number;
    fetching: boolean;
    matches: Array<{ id: string; description: string | null; amount: number; date: string }>;
    selectedMatchIds: Set<string>;
  } | null>(null);
  const [bulkApplying, setBulkApplying] = useState(false);
  const { format } = useCurrency();
  const categoryEditRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryEditRef.current && !categoryEditRef.current.contains(e.target as Node)) {
        setEditingTransactionId(null);
        setCategorySearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    fetch("/api/categories?flat=true")
      .then((res) => (res.ok ? res.json() : []))
      .then((cats) => setCategories(cats))
      .catch(() => setCategories([]));
  }, []);

  const handleChangeCategory = async (transactionId: string, newCategoryId: string) => {
    setChangingCategory(transactionId);
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: newCategoryId }),
      });
      if (res.ok) {
        setEditingTransactionId(null);
        setCategorySearch("");
        fetchDashboard(selectedMonth || undefined);
      }
    } catch (error) {
      console.error("Failed to change category:", error);
    } finally {
      setChangingCategory(null);
    }
  };

  const handlePickNewCategory = async (transactionId: string, newCategoryId: string, newCategoryName: string) => {
    setBulkApplyPrompt({
      transactionId,
      newCategoryId,
      newCategoryName,
      matchIds: [],
      matchCount: 0,
      fetching: true,
      matches: [],
      selectedMatchIds: new Set(),
    });
    setEditingTransactionId(null);
    setCategorySearch("");

    try {
      const res = await fetch("/api/transactions?type=expense");
      if (res.ok) {
        const data = await res.json();
        const allTxns: any[] = data.transactions || [];
        const source = allTxns.find((t) => t.id === transactionId);
        if (source) {
          const sourceDesc = (source.description || "").trim();

          // 1. Extract the merchant/vendor name using the existing auto-categorization logic
          const sourceMerchant = extractMerchantName(sourceDesc).toLowerCase();

          // 2. Find all category keywords that appear in the source description
          const matchedKeywords: string[] = [];
          for (const [, data] of Object.entries(CATEGORY_KEYWORDS)) {
            for (const kw of data.keywords) {
              if (kw && sourceDesc.toLowerCase().includes(kw.toLowerCase())) {
                matchedKeywords.push(kw.toLowerCase());
              }
            }
          }

          // 3. Find other transactions that share the same merchant or any of the same keywords
          const matches = allTxns.filter((t) => {
            if (t.id === transactionId || t.type !== source.type) return false;
            const desc = (t.description || "").trim();
            if (!desc) return false;
            const lowerDesc = desc.toLowerCase();

            // Match by same merchant/vendor name
            if (sourceMerchant && sourceMerchant !== "gopayid") {
              const otherMerchant = extractMerchantName(desc).toLowerCase();
              if (otherMerchant === sourceMerchant) return true;
              if (otherMerchant.length >= 3 && sourceMerchant.length >= 3) {
                if (sourceMerchant.includes(otherMerchant) || otherMerchant.includes(sourceMerchant)) return true;
              }
            }

            // Match by shared category keywords
            if (matchedKeywords.length > 0) {
              for (const kw of matchedKeywords) {
                if (lowerDesc.includes(kw)) return true;
              }
            }

            return false;
          });

          if (matches.length > 0) {
            setBulkApplyPrompt({
              transactionId,
              newCategoryId,
              newCategoryName,
              matchIds: matches.map((m) => m.id),
              matchCount: matches.length,
              fetching: false,
              matches: matches.map((m) => ({
                id: m.id,
                description: m.description,
                amount: Number(m.amount),
                date: m.date,
              })),
              selectedMatchIds: new Set(matches.map((m) => m.id)),
            });
            return;
          }
        }
      }
      setBulkApplyPrompt(null);
      handleChangeCategory(transactionId, newCategoryId);
    } catch (error) {
      console.error("Failed to find matching transactions:", error);
      setBulkApplyPrompt(null);
      handleChangeCategory(transactionId, newCategoryId);
    }
  };

  const handleApplyToAll = async () => {
    if (!bulkApplyPrompt) return;
    const selectedIds = [...bulkApplyPrompt.selectedMatchIds];
    if (selectedIds.length === 0) {
      handleChangeCategory(bulkApplyPrompt.transactionId, bulkApplyPrompt.newCategoryId);
      setBulkApplyPrompt(null);
      return;
    }
    setBulkApplying(true);
    try {
      const res = await fetch("/api/transactions/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [bulkApplyPrompt.transactionId, ...selectedIds],
          categoryId: bulkApplyPrompt.newCategoryId,
        }),
      });
      if (res.ok) {
        setBulkApplyPrompt(null);
        fetchDashboard(selectedMonth || undefined);
      }
    } catch (error) {
      console.error("Failed to bulk recategorize:", error);
    } finally {
      setBulkApplying(false);
    }
  };

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <Card variant="bordered" className={selectedCategoryId ? "lg:col-span-2" : "lg:col-span-2"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Spending by Category</CardTitle>
              {selectedCategoryId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategoryId(null)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.spendingByCategory.length === 0 ? (
              <div className="h-[260px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
                No spending data this month
              </div>
            ) : (
              <div>
                <div className={`grid gap-6 ${selectedCategoryId ? "md:grid-cols-2" : ""}`}>
                  <div>
                    <div className="h-[260px] sm:h-[300px]">
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
                            onClick={(entry) => setSelectedCategoryId(entry.categoryId === selectedCategoryId ? null : entry.categoryId)}
                          >
                            {data.spendingByCategory.map((entry, index) => (
                              <Cell
                                key={`cell-${entry.categoryId}`}
                                fill={entry.color}
                                opacity={!selectedCategoryId || selectedCategoryId === entry.categoryId ? 1 : 0.3}
                                stroke={selectedCategoryId === entry.categoryId ? "#fff" : "transparent"}
                                strokeWidth={selectedCategoryId === entry.categoryId ? 2 : 0}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => format(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                {selectedCategoryId && (() => {
                  const cat = data.spendingByCategory.find(c => c.categoryId === selectedCategoryId);
                  if (!cat || cat.transactions.length === 0) {
                    return (
                      <div className="h-[260px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
                        No transactions in this category
                      </div>
                    );
                  }
                  return (
                    <div ref={categoryEditRef} className="max-h-[450px] overflow-y-auto space-y-2 pr-2">
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        {cat.name} — {format(cat.value)}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Click the category badge to recategorize an expense.
                      </p>
                      {cat.transactions.map((t) => {
                        const isEditing = editingTransactionId === t.id;
                        const isChanging = changingCategory === t.id;
                        return (
                          <div
                            key={t.id}
                            className="rounded-lg border border-border p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{t.description || "Transaction"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(t.date).toLocaleDateString()}
                                  {t.paymentMethod ? ` • ${t.paymentMethod}` : ""}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-destructive shrink-0">
                                -{format(t.amount)}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingTransactionId(isEditing ? null : t.id);
                                  setCategorySearch("");
                                }}
                                disabled={isChanging}
                                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
                                style={{ backgroundColor: (cat.color || "#6b7280") + "20" }}
                              >
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color || "#6b7280" }} />
                                <span>{cat.name}</span>
                                <ChevronDown className="h-3 w-3" />
                              </button>
                              {isChanging && (
                                <span className="text-xs text-muted-foreground">Saving...</span>
                              )}
                            </div>
                            {isEditing && (
                              <div className="mt-2">
                                <input
                                  type="text"
                                  placeholder="Search categories..."
                                  value={categorySearch}
                                  onChange={(e) => setCategorySearch(e.target.value)}
                                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                                  autoFocus
                                />
                                <div className="mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                                  {(() => {
                                    const q = categorySearch.toLowerCase().trim();
                                    const expenseCats = categories.filter((c) => c.type && c.type.toLowerCase() === "expense");
                                    const parents = expenseCats.filter((c) => c.parentId === null);
                                    const results: React.ReactNode[] = [];

                                    for (const parent of parents) {
                                      const children = expenseCats.filter((c) => c.parentId === parent.id);
                                      const parentName = parent.name || "";
                                      const parentMatches = !q || parentName.toLowerCase().includes(q);
                                      const matchingChildren = q
                                        ? children.filter((c) => (c.name || "").toLowerCase().includes(q) || parentMatches)
                                        : [];

                                      // No search: show parents only.
                                      if (!q) {
                                        results.push(
                                          <button
                                            key={parent.id}
                                            onClick={() => handlePickNewCategory(t.id, parent.id, parentName)}
                                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent"
                                          >
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: parent.color || "#6b7280" }} />
                                            <span className="font-medium">{parentName}</span>
                                          </button>
                                        );
                                        continue;
                                      }

                                      // Searching: skip if neither parent nor any child matches.
                                      const hasChildMatch = children.some((c) => (c.name || "").toLowerCase().includes(q));
                                      if (!parentMatches && !hasChildMatch) continue;

                                      // Render the parent itself.
                                      if (parentMatches) {
                                        results.push(
                                          <button
                                            key={parent.id}
                                            onClick={() => handlePickNewCategory(t.id, parent.id, parentName)}
                                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent"
                                          >
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: parent.color || "#6b7280" }} />
                                            <span className="font-medium">{parentName}</span>
                                            {matchingChildren.length > 0 && (
                                              <span className="ml-auto text-xs text-muted-foreground">parent</span>
                                            )}
                                          </button>
                                        );
                                      }

                                      // Render matching children (and all children when parent matches).
                                      for (const child of matchingChildren) {
                                        const childName = child.name || "";
                                        results.push(
                                          <button
                                            key={child.id}
                                            onClick={() => handlePickNewCategory(t.id, child.id, `${parentName} – ${childName}`)}
                                            className="flex w-full items-center gap-2 px-3 py-1.5 pl-6 text-left text-sm hover:bg-accent"
                                          >
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: child.color || parent.color || "#6b7280" }} />
                                            <span>{childName}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">{parentName}</span>
                                          </button>
                                        );
                                      }
                                    }

                                    if (results.length === 0) {
                                      return <div className="px-3 py-2 text-sm text-muted-foreground">No categories found</div>;
                                    }
                                    return results;
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.spendingByCategory.map((category) => (
                  <button
                    key={category.categoryId}
                    onClick={() => setSelectedCategoryId(selectedCategoryId === category.categoryId ? null : category.categoryId)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-accent ${
                      selectedCategoryId === category.categoryId ? "bg-accent ring-1 ring-border" : ""
                    }`}
                  >
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                    <span className="text-xs text-muted-foreground truncate">{category.name}</span>
                  </button>
                ))}
              </div>
              </div>
            )}
          </CardContent>
        </Card>

        {bulkApplyPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-card p-4 sm:p-6 shadow-lg max-h-[85vh] overflow-y-auto">
              {bulkApplyPrompt.fetching ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Finding similar transactions...</div>
              ) : (
                <>
                  <h3 className="mb-1 text-lg font-semibold">Apply to similar transactions?</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Found <span className="font-medium text-foreground">{bulkApplyPrompt.matchCount}</span> transaction{bulkApplyPrompt.matchCount === 1 ? "" : "s"} from the same vendor/keyword. Select which ones to recategorize as{" "}
                    <span className="font-medium text-foreground">{bulkApplyPrompt.newCategoryName}</span>:
                  </p>

                  <div className="mb-3 flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      {bulkApplyPrompt.selectedMatchIds.size} of {bulkApplyPrompt.matchCount} selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setBulkApplyPrompt((p) =>
                            p ? { ...p, selectedMatchIds: new Set(p.matchIds) } : p
                          )
                        }
                        className="text-xs text-primary hover:underline"
                      >
                        Select all
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        onClick={() =>
                          setBulkApplyPrompt((p) =>
                            p ? { ...p, selectedMatchIds: new Set() } : p
                          )
                        }
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                    {bulkApplyPrompt.matches.map((m) => {
                      const checked = bulkApplyPrompt.selectedMatchIds.has(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() =>
                            setBulkApplyPrompt((p) => {
                              if (!p) return p;
                              const next = new Set(p.selectedMatchIds);
                              if (next.has(m.id)) next.delete(m.id);
                              else next.add(m.id);
                              return { ...p, selectedMatchIds: next };
                            })
                          }
                          className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors ${
                            checked ? "bg-accent" : "hover:bg-accent/50"
                          }`}
                        >
                          {checked ? (
                            <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{m.description || "Transaction"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(m.date).toLocaleDateString()} • {format(m.amount)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={bulkApplying}
                      onClick={() => {
                        handleChangeCategory(bulkApplyPrompt.transactionId, bulkApplyPrompt.newCategoryId);
                        setBulkApplyPrompt(null);
                      }}
                    >
                      Just this one
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={bulkApplying || bulkApplyPrompt.selectedMatchIds.size === 0}
                      onClick={handleApplyToAll}
                    >
                      {bulkApplying
                        ? "Applying..."
                        : `Apply to ${bulkApplyPrompt.selectedMatchIds.size + 1} transaction${bulkApplyPrompt.selectedMatchIds.size === 0 ? "" : "s"}`}
                    </Button>
                  </div>
                  <button
                    onClick={() => setBulkApplyPrompt(null)}
                    disabled={bulkApplying}
                    className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlyTrend.length === 0 ? (
              <div className="h-[260px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
                No data yet. Add transactions to see trends.
              </div>
            ) : (
              <div className="h-[260px] sm:h-[300px]">
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
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 sm:p-4"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div
                      className={`rounded-full p-2 shrink-0 ${
                        transaction.type === "income" ? "bg-success/10" : "bg-destructive/10"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{transaction.description || "Transaction"}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {transaction.category?.name || "Uncategorized"} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold shrink-0 ${
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
