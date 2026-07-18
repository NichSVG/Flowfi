"use client";

import { useState, useEffect, useRef } from "react";
import { CATEGORY_KEYWORDS } from "@/lib/category-keywords";
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  X,
  Tag,
  Upload,
  FileText,
  CheckCircle,
  CheckSquare,
  Square,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/lib/use-currency";

interface Category {
  id: string;
  name: string;
  color: string | null;
  type: string;
  parentId: string | null;
  children?: Category[];
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  date: string;
  paymentMethod: string | null;
  categoryId: string;
  category: { name: string; color: string | null } | null;
}

export default function TransactionsPage() {
  const { format } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recategorizing, setRecategorizing] = useState(false);
  const [recategorizeResult, setRecategorizeResult] = useState<{ message: string; updated: number; changes?: Array<{ description: string; from: string; to: string }> } | null>(null);
  const [uploadResult, setUploadResult] = useState<{ message: string; count: number; errors?: string[] } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSourceCategory, setReviewSourceCategory] = useState("Miscellaneous");
  const [reviewUpdating, setReviewUpdating] = useState<string | null>(null);
  const [reviewCategorySearch, setReviewCategorySearch] = useState<Record<string, string>>({});
  const [showReviewDropdownFor, setShowReviewDropdownFor] = useState<string | null>(null);
  const [reviewTargetId, setReviewTargetId] = useState<Record<string, string>>({});

  const [detectedPatterns, setDetectedPatterns] = useState<{
    pattern: string;
    suggestedCategoryId: string;
    suggestedCategoryName: string;
    transactionIds: string[];
    count: number;
  }[]>([]);
  const [showPatternResults, setShowPatternResults] = useState(false);
  const [confirmingPattern, setConfirmingPattern] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    categoryId: "",
    type: "expense" as "income" | "expense",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Credit Card",
    notes: "",
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#6366f1",
    type: "expense" as "income" | "expense",
  });

  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showInlineCategoryInput, setShowInlineCategoryInput] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [bulkCategorySearch, setBulkCategorySearch] = useState("");
  const [showBulkCategoryDropdown, setShowBulkCategoryDropdown] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("#6366f1");
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
        setShowInlineCategoryInput(false);
        setInlineCategoryName("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-review-dropdown]")) {
        setShowReviewDropdownFor(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [transRes, catRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/categories?flat=true"),
      ]);

      if (transRes.ok) {
        const data = await transRes.json();
        setTransactions(data.transactions || []);
      }

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || t.category?.name === selectedCategory;
    const matchesType = selectedType === "all" || t.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} transaction(s)?`)) return;

    setBulkProcessing(true);
    try {
      const res = await fetch("/api/transactions/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setTransactions(transactions.filter((t) => !selectedIds.has(t.id)));
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error("Failed to delete transactions:", error);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkCategoryChange = async () => {
    if (selectedIds.size === 0 || !bulkCategoryId) return;

    setBulkProcessing(true);
    try {
      const res = await fetch("/api/transactions/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          categoryId: bulkCategoryId,
        }),
      });

      if (res.ok) {
        const cat = categories.find((c) => c.id === bulkCategoryId);
        setTransactions(
          transactions.map((t) => {
            if (selectedIds.has(t.id)) {
              return {
                ...t,
                categoryId: bulkCategoryId,
                category: cat ? { name: cat.name, color: cat.color } : t.category,
              };
            }
            return t;
          })
        );
        setSelectedIds(new Set());
        setShowBulkCategoryModal(false);
        setBulkCategoryId("");
      }
    } catch (error) {
      console.error("Failed to update transactions:", error);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    setCategoryError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });

      if (res.ok) {
        const cat = await res.json();
        setCategories((prev) => prev.some((c) => c.id === cat.id) ? prev : [...prev, cat]);
        setNewCategory({ name: "", color: "#6366f1", type: "expense" });
        setShowCategoryModal(false);
      } else {
        const data = await res.json();
        setCategoryError(data.error || "Failed to add category");
      }
    } catch (error) {
      console.error("Failed to add category:", error);
      setCategoryError("Failed to add category");
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategoryId || !editCategoryName.trim()) return;
    setCategoryError(null);
    try {
      const res = await fetch(`/api/categories/${editingCategoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editCategoryName.trim(), color: editCategoryColor }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCategories(categories.map((c) => (c.id === updated.id ? { ...c, name: updated.name, color: updated.color } : c)));
        setEditingCategoryId(null);
        setEditCategoryName("");
        setEditCategoryColor("#6366f1");
      } else {
        const data = await res.json();
        setCategoryError(data.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Failed to edit category:", error);
      setCategoryError("Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setCategoryError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });

      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== id));
        setDeletingCategoryId(null);
      } else {
        const data = await res.json();
        setCategoryError(data.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      setCategoryError("Failed to delete category");
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryColor(cat.color || "#6366f1");
    setCategoryError(null);
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditCategoryName("");
    setEditCategoryColor("#6366f1");
    setCategoryError(null);
  };

  const handleCreateInlineCategory = async () => {
    const name = inlineCategoryName.trim();
    if (!name) return;

    setCreatingCategory(true);
    setCategoryError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: formData.type, color: "#6366f1" }),
      });

      if (res.ok) {
        const cat = await res.json();
        setCategories((prev) => prev.some((c) => c.id === cat.id) ? prev : [...prev, cat]);
        setFormData({ ...formData, categoryId: cat.id });
        setInlineCategoryName("");
        setShowInlineCategoryInput(false);
        setCategorySearch("");
        setShowCategoryDropdown(false);
      } else {
        const data = await res.json();
        setCategoryError(data.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Failed to create category:", error);
      setCategoryError("Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleAddTransaction = async () => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (res.ok) {
        const newTrans = await res.json();
        setTransactions([newTrans, ...transactions]);
        setShowAddModal(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Failed to add transaction:", error);
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;

    try {
      const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (res.ok) {
        setEditingTransaction(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Failed to edit transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTransactions(transactions.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const handleReviewCategoryChange = async (transactionId: string, newCategoryId: string) => {
    setReviewUpdating(transactionId);
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: newCategoryId }),
      });
      if (res.ok) {
        setTransactions(prev => prev.map(t =>
          t.id === transactionId ? { ...t, categoryId: newCategoryId } : t
        ));
      }
    } catch (e) {
      console.error("Error updating transaction:", e);
    } finally {
      setReviewUpdating(null);
    }
  };

  const handleDetectPatterns = () => {
    const sourceCats = categories.filter(c => c.name === reviewSourceCategory);
    const sourceIds = sourceCats.flatMap(sc => {
      if (!sc.parentId) {
        return [sc.id, ...categories.filter(c => c.parentId === sc.id).map(c => c.id)];
      }
      return [sc.id];
    });
    const reviewTransactions = transactions.filter(t => sourceIds.includes(t.categoryId));

    const groups: Record<string, typeof reviewTransactions> = {};
    for (const t of reviewTransactions) {
      const desc = (t.description || "").toUpperCase().replace(/[^A-Z\s]/g, "").trim();
      const words = desc.split(/\s+/).filter(w => w.length > 2);
      const key = words[0] || desc;
      if (!key) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }

    const patterns: typeof detectedPatterns = [];
    for (const [pattern, txns] of Object.entries(groups)) {
      if (txns.length < 2) continue;
      const descLower = txns[0].description?.toLowerCase() || "";
      let suggested: { id: string; name: string } | null = null;
      for (const [, data] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const kw of data.keywords) {
          if (descLower.includes(kw)) {
            const cat = categories.find(c => {
              if (data.subcategory && c.name === data.subcategory) {
                if (data.parent) {
                  const parent = categories.find(p => p.id === c.parentId);
                  return parent?.name === data.parent;
                }
                return !c.parentId;
              }
              return false;
            });
            if (cat) { suggested = { id: cat.id, name: cat.name }; break; }
          }
        }
        if (suggested) break;
      }
      if (suggested) {
        patterns.push({
          pattern,
          suggestedCategoryId: suggested.id,
          suggestedCategoryName: suggested.name,
          transactionIds: txns.map(t => t.id),
          count: txns.length,
        });
      }
    }

    patterns.sort((a, b) => b.count - a.count);
    setDetectedPatterns(patterns);
    setShowPatternResults(true);
  };

  const handleApplyPattern = async (patternIndex: number) => {
    const pattern = detectedPatterns[patternIndex];
    if (!pattern) return;
    setConfirmingPattern(patternIndex);
    try {
      await Promise.all(pattern.transactionIds.map(id =>
        fetch(`/api/transactions/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: pattern.suggestedCategoryId }),
        })
      ));
      setTransactions(prev => prev.map(t =>
        pattern.transactionIds.includes(t.id)
          ? { ...t, categoryId: pattern.suggestedCategoryId }
          : t
      ));
      setDetectedPatterns(prev => prev.filter((_, i) => i !== patternIndex));
    } catch (e) {
      console.error("Error applying pattern:", e);
    } finally {
      setConfirmingPattern(null);
    }
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      categoryId: "",
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Credit Card",
      notes: "",
    });
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description || "",
      amount: transaction.amount.toString(),
      categoryId: transaction.categoryId || "",
      type: transaction.type as "income" | "expense",
      date: new Date(transaction.date).toISOString().split("T")[0],
      paymentMethod: transaction.paymentMethod || "Credit Card",
      notes: "",
    });
  };

  const handleRecategorize = async () => {
    setRecategorizing(true);
    setRecategorizeResult(null);
    try {
      const res = await fetch("/api/transactions/recategorize", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRecategorizeResult(data);
        fetchData(); // Refresh the transaction list
      }
    } catch (error) {
      console.error("Failed to recategorize:", error);
    } finally {
      setRecategorizing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadResult({
          message: data.message,
          count: data.count,
          errors: data.errors,
        });
        fetchData();
      } else {
        setUploadResult({
          message: data.error || "Upload failed",
          count: 0,
          errors: Array.isArray(data.details) ? data.details : data.details ? [data.details] : [],
        });
      }
    } catch {
      setUploadResult({
        message: "An error occurred during upload",
        count: 0,
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button variant="outline" onClick={handleRecategorize} disabled={recategorizing}>
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${recategorizing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{recategorizing ? "Categorizing..." : "Auto-Categorize"}</span>
          </Button>
          <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
            <Tag className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Categories</span>
          </Button>
          <Button variant="outline" onClick={() => { setReviewSourceCategory("Miscellaneous"); setShowReviewModal(true); }}>
            <Search className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Review</span>
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {recategorizeResult && (
        <Card variant="bordered" className="border-success/50 bg-success/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-success">{recategorizeResult.message}</p>
                {recategorizeResult.changes && recategorizeResult.changes.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {recategorizeResult.changes.slice(0, 5).map(c => `"${c.description}" → ${c.to}`).join("; ")}
                    {recategorizeResult.changes.length > 5 && `... and ${recategorizeResult.changes.length - 5} more`}
                  </p>
                )}
              </div>
              <button onClick={() => setRecategorizeResult(null)} className="rounded p-1 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedIds.size > 0 && (
        <Card variant="bordered" className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkCategoryModal(true)}
                  disabled={bulkProcessing}
                >
                  <Tag className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Change Category</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkProcessing}
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete Selected</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card variant="bordered">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories
                  .filter((c) => c.parentId === null)
                  .map((parent) => {
                    const children = categories.filter((c) => c.parentId === parent.id);
                    if (children.length === 0) {
                      return (
                        <option key={parent.id} value={parent.name}>{parent.name}</option>
                      );
                    }
                    return (
                      <optgroup key={parent.id} label={parent.name}>
                        {children.map((child) => (
                          <option key={child.id} value={child.name}>{child.name}</option>
                        ))}
                      </optgroup>
                    );
                  })}
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as "all" | "income" | "expense")}
                className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered">
        <CardContent className="pt-6">
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No transactions yet. Add one or import a bank statement.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/30">
                  <button
                    onClick={toggleSelectAll}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {selectedIds.size === filteredTransactions.length ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size === filteredTransactions.length ? "Deselect all" : "Select all"}
                  </span>
                </div>

                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between gap-2 sm:gap-3 rounded-lg border p-3 sm:p-4 hover:bg-accent/50 transition-colors ${
                      selectedIds.has(transaction.id) ? "border-primary/50 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => toggleSelect(transaction.id)}
                        aria-label="Toggle selection"
                        className="p-1.5 sm:p-0 -ml-1.5 sm:ml-0 text-muted-foreground hover:text-foreground"
                      >
                        {selectedIds.has(transaction.id) ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
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
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: transaction.category?.color || "#6b7280" }}
                          />
                          <span className="truncate">
                            {transaction.category?.name || "Uncategorized"} • {new Date(transaction.date).toLocaleDateString()}
                            {transaction.paymentMethod && ` • ${transaction.paymentMethod}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <p
                        className={`font-semibold text-sm sm:text-base ${
                          transaction.type === "income" ? "text-success" : "text-destructive"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {format(transaction.amount)}
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(transaction)}
                          aria-label="Edit transaction"
                          className="rounded p-2 hover:bg-accent"
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          aria-label="Delete transaction"
                          className="rounded p-2 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {(showAddModal || editingTransaction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-4 sm:p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingTransaction ? "Edit Transaction" : "Add Transaction"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTransaction(null);
                  resetForm();
                }}
                className="rounded p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex rounded-lg border border-border">
                <button
                  onClick={() => setFormData({ ...formData, type: "expense" })}
                  className={`flex-1 py-2 text-sm font-medium ${
                    formData.type === "expense"
                      ? "bg-destructive text-destructive-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setFormData({ ...formData, type: "income" })}
                  className={`flex-1 py-2 text-sm font-medium ${
                    formData.type === "income"
                      ? "bg-success text-success-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  Income
                </button>
              </div>

              <Input
                label="Description"
                placeholder="What was this for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Input
                label="Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />

              <div>
                <label className="mb-2 block text-sm font-medium">Category</label>
                <div className="relative" ref={categoryDropdownRef}>
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch || (formData.categoryId ? categories.find(c => c.id === formData.categoryId)?.name || "" : "")}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setShowCategoryDropdown(true);
                      if (!e.target.value) {
                        setFormData({ ...formData, categoryId: "" });
                      }
                    }}
                    onFocus={() => {
                      setShowCategoryDropdown(true);
                      setCategorySearch("");
                    }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {showCategoryDropdown && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                      {(() => {
                        const q = categorySearch.toLowerCase();
                        const filtered = categories
                          .filter((c) => {
                            if (formData.type === "income" ? c.type !== "income" : c.type !== "expense") return false;
                            if (!q) return true;
                            return c.name.toLowerCase().includes(q);
                          });

                        const parents = filtered.filter((c) => c.parentId === null);
                        const results: React.ReactNode[] = [];

                        for (const parent of parents) {
                          const children = filtered.filter((c) => c.parentId === parent.id);
                          const parentMatches = parent.name.toLowerCase().includes(q);

                          if (parentMatches && !q) {
                            results.push(
                              <button
                                key={parent.id}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setFormData({ ...formData, categoryId: parent.id });
                                  setCategorySearch("");
                                  setShowCategoryDropdown(false);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-muted-foreground hover:bg-accent"
                              >
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: parent.color || "#6b7280" }} />
                                {parent.name}
                              </button>
                            );
                          }

                          for (const child of children) {
                            results.push(
                              <button
                                key={child.id}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setFormData({ ...formData, categoryId: child.id });
                                  setCategorySearch("");
                                  setShowCategoryDropdown(false);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-accent"
                              >
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: child.color || parent.color || "#6b7280" }} />
                                <span>{child.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">{parent.name}</span>
                              </button>
                            );
                          }

                          if (parentMatches && q && children.length > 0) {
                            results.push(
                              <button
                                key={parent.id + "-self"}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setFormData({ ...formData, categoryId: parent.id });
                                  setCategorySearch("");
                                  setShowCategoryDropdown(false);
                                }}
                                className="flex w-full items-center gap-3 px-6 py-2 text-left text-sm hover:bg-accent"
                              >
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: parent.color || "#6b7280" }} />
                                <span>{parent.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">parent</span>
                              </button>
                            );
                          }
                        }

                        if (results.length === 0 && !showInlineCategoryInput) {
                          return (
                            <>
                              <div className="px-4 py-3 text-sm text-muted-foreground">No categories found</div>
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowInlineCategoryInput(true)}
                                className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-left text-sm text-primary hover:bg-accent"
                              >
                                <span className="text-lg leading-none">+</span>
                                Create "{categorySearch}"
                              </button>
                            </>
                          );
                        }

                        return (
                          <>
                            {results}
                            {showInlineCategoryInput ? (
                              <div className="border-t border-border p-3">
                                <input
                                  type="text"
                                  placeholder="New category name"
                                  value={inlineCategoryName}
                                  onChange={(e) => setInlineCategoryName(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateInlineCategory(); }}
                                  className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm mb-2 focus:border-primary focus:outline-none"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => { setShowInlineCategoryInput(false); setInlineCategoryName(""); }}
                                    className="flex-1 rounded px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleCreateInlineCategory}
                                    disabled={!inlineCategoryName.trim() || creatingCategory}
                                    className="flex-1 rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                  >
                                    {creatingCategory ? "Creating..." : "Create"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowInlineCategoryInput(true)}
                                className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-left text-sm text-primary hover:bg-accent"
                              >
                                <span className="text-lg leading-none">+</span>
                                Create category
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />

              <div>
                <label className="mb-2 block text-sm font-medium">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="E-Wallet">E-Wallet</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={editingTransaction ? handleEditTransaction : handleAddTransaction}
                  disabled={!formData.description || !formData.amount || !formData.categoryId}
                >
                  {editingTransaction ? "Save Changes" : "Add Transaction"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-4 sm:p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Change Category</h2>
              <button
                onClick={() => {
                  setShowBulkCategoryModal(false);
                  setBulkCategoryId("");
                }}
                className="rounded p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Change category for {selectedIds.size} selected transaction(s)
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">New Category</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={bulkCategorySearch || (bulkCategoryId ? categories.find(c => c.id === bulkCategoryId)?.name || "" : "")}
                    onChange={(e) => {
                      setBulkCategorySearch(e.target.value);
                      setShowBulkCategoryDropdown(true);
                      if (!e.target.value) {
                        setBulkCategoryId("");
                      }
                    }}
                    onFocus={() => {
                      setShowBulkCategoryDropdown(true);
                      setBulkCategorySearch("");
                    }}
                    onBlur={() => setTimeout(() => setShowBulkCategoryDropdown(false), 200)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {showBulkCategoryDropdown && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                      {(() => {
                        const q = bulkCategorySearch.toLowerCase();
                        const filtered = categories.filter((c) => !q || c.name.toLowerCase().includes(q));

                        const parents = filtered.filter((c) => c.parentId === null);
                        const results: React.ReactNode[] = [];

                        for (const parent of parents) {
                          const children = filtered.filter((c) => c.parentId === parent.id);
                          const parentMatches = parent.name.toLowerCase().includes(q);

                          if (parentMatches && !q) {
                            results.push(
                              <button
                                key={parent.id}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setBulkCategoryId(parent.id);
                                  setBulkCategorySearch("");
                                  setShowBulkCategoryDropdown(false);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-muted-foreground hover:bg-accent"
                              >
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: parent.color || "#6b7280" }} />
                                {parent.name}
                              </button>
                            );
                          }

                          for (const child of children) {
                            results.push(
                              <button
                                key={child.id}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setBulkCategoryId(child.id);
                                  setBulkCategorySearch("");
                                  setShowBulkCategoryDropdown(false);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-accent"
                              >
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: child.color || parent.color || "#6b7280" }} />
                                <span>{child.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">{parent.name}</span>
                              </button>
                            );
                          }

                          if (parentMatches && q && children.length > 0) {
                            results.push(
                              <button
                                key={parent.id + "-self"}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setBulkCategoryId(parent.id);
                                  setBulkCategorySearch("");
                                  setShowBulkCategoryDropdown(false);
                                }}
                                className="flex w-full items-center gap-3 px-6 py-2 text-left text-sm hover:bg-accent"
                              >
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: parent.color || "#6b7280" }} />
                                <span>{parent.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">parent</span>
                              </button>
                            );
                          }
                        }

                        if (results.length === 0) {
                          return <div className="px-4 py-3 text-sm text-muted-foreground">No categories found</div>;
                        }

                        return results;
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowBulkCategoryModal(false);
                    setBulkCategoryId("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleBulkCategoryChange}
                  disabled={!bulkCategoryId || bulkProcessing}
                >
                  {bulkProcessing ? "Updating..." : "Update Category"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-4 sm:p-6 shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Manage Categories</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="rounded p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 rounded-lg border border-border p-4">
              <h3 className="mb-3 text-sm font-medium">Add New Category</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Category name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-muted-foreground">Type</label>
                    <select
                      value={newCategory.type}
                      onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as "income" | "expense" })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Color</label>
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="h-9 w-9 cursor-pointer rounded border border-border"
                    />
                  </div>
                </div>
                <Button onClick={handleAddCategory} disabled={!newCategory.name.trim()} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
            </div>

            <div>
              {categoryError && (
                <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {categoryError}
                </div>
              )}

              <h3 className="mb-3 text-sm font-medium">Expense Categories</h3>
              <div className="space-y-2 mb-4">
                {categories.filter((c) => c.type === "expense").map((cat) => (
                  <div key={cat.id} className="rounded-lg border border-border p-3">
                    {editingCategoryId === cat.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editCategoryColor}
                            onChange={(e) => setEditCategoryColor(e.target.value)}
                            className="h-8 w-8 cursor-pointer rounded border border-border"
                          />
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleEditCategory(); if (e.key === "Escape") cancelEditCategory(); }}
                            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleEditCategory}
                            disabled={!editCategoryName.trim()}
                            className="flex-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditCategory}
                            className="flex-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : deletingCategoryId === cat.id ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-destructive">Delete "{cat.name}"?</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeletingCategoryId(null)}
                            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: cat.color || "#6b7280" }}
                          />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditCategory(cat)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setDeletingCategoryId(cat.id); setCategoryError(null); }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="mb-3 text-sm font-medium">Income Categories</h3>
              <div className="space-y-2">
                {categories.filter((c) => c.type === "income").map((cat) => (
                  <div key={cat.id} className="rounded-lg border border-border p-3">
                    {editingCategoryId === cat.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editCategoryColor}
                            onChange={(e) => setEditCategoryColor(e.target.value)}
                            className="h-8 w-8 cursor-pointer rounded border border-border"
                          />
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleEditCategory(); if (e.key === "Escape") cancelEditCategory(); }}
                            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleEditCategory}
                            disabled={!editCategoryName.trim()}
                            className="flex-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditCategory}
                            className="flex-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : deletingCategoryId === cat.id ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-destructive">Delete "{cat.name}"?</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeletingCategoryId(null)}
                            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: cat.color || "#6b7280" }}
                          />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditCategory(cat)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setDeletingCategoryId(cat.id); setCategoryError(null); }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowCategoryModal(false)}
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-4 sm:p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Import Bank Statement</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadResult(null);
                }}
                className="rounded p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!uploadResult ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV or PDF bank statement. Categories will be auto-detected.
                </p>

                <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="mb-2 text-sm font-medium">
                    Drop your CSV or PDF files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Supports: CSV and PDF bank statements (multiple files allowed)
                  </p>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    {uploading ? "Uploading..." : "Choose Files"}
                    <input
                      type="file"
                      accept=".csv,.pdf"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs font-medium mb-2">Supported formats:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">CSV Files</p>
                        <p className="text-xs text-muted-foreground">
                          Date, Description, Amount, Type columns
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">PDF Bank Statements</p>
                        <p className="text-xs text-muted-foreground">
                          Indonesian bank statements (bluAccount, BCA, BRI, etc.)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`rounded-lg p-4 ${
                    uploadResult.count > 0
                      ? "bg-success/10 border border-success/20"
                      : "bg-destructive/10 border border-destructive/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle
                      className={`h-5 w-5 ${
                        uploadResult.count > 0 ? "text-success" : "text-destructive"
                      }`}
                    />
                    <p className="font-medium">{uploadResult.message}</p>
                  </div>
                </div>

                {Array.isArray(uploadResult.errors) && uploadResult.errors.length > 0 && (
                  <div className="rounded-lg border border-border p-4 max-h-40 overflow-y-auto">
                    <p className="text-xs font-medium mb-2 text-muted-foreground">
                      Warnings ({uploadResult.errors.length}):
                    </p>
                    {uploadResult.errors.slice(0, 10).map((err, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {err}
                      </p>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        ...and {uploadResult.errors.length - 10} more
                      </p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadResult(null);
                  }}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-xl bg-card p-6 shadow-xl border border-border max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Review Transactions</h2>
                <p className="text-sm text-muted-foreground">Reassign transactions to proper categories</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium">Reviewing category</label>
                <select
                  value={reviewSourceCategory}
                  onChange={(e) => { setReviewSourceCategory(e.target.value); setReviewTargetId({}); setDetectedPatterns([]); setShowPatternResults(false); }}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                >
                  {(() => {
                    const miscCat = categories.find(c => c.name === "Miscellaneous" && !c.parentId);
                    const otherCats = categories.filter(c => c.name === "Other");
                    const options: { id: string; label: string }[] = [];
                    if (miscCat) {
                      const count = transactions.filter(t => t.categoryId === miscCat.id).length;
                      options.push({ id: miscCat.name, label: `Miscellaneous (${count})` });
                    }
                    for (const oc of otherCats) {
                      const parent = oc.parentId ? categories.find(p => p.id === oc.parentId) : null;
                      const count = transactions.filter(t => t.categoryId === oc.id).length;
                      options.push({ id: oc.name, label: `${parent?.name || "Unknown"}: Other (${count})` });
                    }
                    return options.map(o => (
                      <option key={o.id + o.label} value={o.id}>{o.label}</option>
                    ));
                  })()}
                </select>
              </div>
              <Button variant="outline" onClick={handleDetectPatterns}>
                <Search className="mr-2 h-4 w-4" />
                Detect Patterns
              </Button>
            </div>

            {showPatternResults && detectedPatterns.length > 0 && (
              <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <h3 className="text-sm font-semibold mb-3">Detected Patterns</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detectedPatterns.map((p, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-border bg-background px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">"{p.pattern}"</span>
                        <span className="text-xs text-muted-foreground ml-2">({p.count} transactions)</span>
                        <span className="text-xs text-muted-foreground ml-2">&rarr; {p.suggestedCategoryName}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplyPattern(i)}
                        disabled={confirmingPattern === i}
                      >
                        {confirmingPattern === i ? "Applying..." : "Apply"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showPatternResults && detectedPatterns.length === 0 && (
              <div className="mb-4 rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
                No patterns detected.
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2">
              {(() => {
                const sourceCats = categories.filter(c => c.name === reviewSourceCategory);
                const sourceIds = sourceCats.flatMap(sc => {
                  if (!sc.parentId) {
                    return [sc.id, ...categories.filter(c => c.parentId === sc.id).map(c => c.id)];
                  }
                  return [sc.id];
                });
                const reviewTransactions = transactions.filter(t => sourceIds.includes(t.categoryId));

                if (reviewTransactions.length === 0) {
                  return (
                    <div className="py-8 text-center text-muted-foreground">
                      <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" />
                      No transactions in this category.
                    </div>
                  );
                }

                return reviewTransactions.map(t => (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString("id-ID")} &middot; {t.type === "income" ? "+" : "-"}Rp {Number(t.amount).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="relative w-52" data-review-dropdown>
                      <input
                        type="text"
                        placeholder={reviewUpdating === t.id ? "Saving..." : "Search category..."}
                        value={showReviewDropdownFor === t.id ? (reviewCategorySearch[t.id] || "") : (reviewTargetId[t.id] ? (categories.find(c => c.id === reviewTargetId[t.id])?.name || "") : "")}
                        onChange={(e) => {
                          setReviewTargetId(prev => ({ ...prev, [t.id]: "" }));
                          setReviewCategorySearch(prev => ({ ...prev, [t.id]: e.target.value }));
                          setShowReviewDropdownFor(t.id);
                        }}
                        onFocus={() => {
                          setReviewCategorySearch(prev => ({ ...prev, [t.id]: "" }));
                          setShowReviewDropdownFor(t.id);
                        }}
                        disabled={reviewUpdating === t.id}
                        className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
                      />
                      {showReviewDropdownFor === t.id && (reviewCategorySearch[t.id] || "").length > 0 && (
                        <div data-review-dropdown className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                          {(() => {
                            const q = (reviewCategorySearch[t.id] || "").toLowerCase();
                            const filtered = categories
                              .filter(c => {
                                if (c.name === reviewSourceCategory) return false;
                                if (c.parentId) {
                                  const parent = categories.find(p => p.id === c.parentId);
                                  if (parent?.name === reviewSourceCategory) return false;
                                }
                                return c.name.toLowerCase().includes(q);
                              });

                            if (filtered.length === 0) {
                              return <div className="px-4 py-3 text-sm text-muted-foreground">No categories found</div>;
                            }

                            return filtered
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(c => {
                                const parent = c.parentId ? categories.find(p => p.id === c.parentId) : null;
                                return (
                                  <button
                                    key={c.id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      handleReviewCategoryChange(t.id, c.id);
                                      setReviewTargetId(prev => ({ ...prev, [t.id]: c.id }));
                                      setReviewCategorySearch(prev => ({ ...prev, [t.id]: "" }));
                                      setShowReviewDropdownFor(null);
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-accent"
                                  >
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color || "#6b7280" }} />
                                    <span>{c.name}</span>
                                    {parent && <span className="ml-auto text-xs text-muted-foreground">{parent.name}</span>}
                                  </button>
                                );
                              });
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>

            <Button className="mt-4 w-full" onClick={() => setShowReviewModal(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
