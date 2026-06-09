"use client";

import { useState, useEffect } from "react";
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
  const [uploadResult, setUploadResult] = useState<{ message: string; count: number; errors?: string[] } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [transRes, catRes] = await Promise.all([
        fetch("/api/transactions?limit=100"),
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

  const getCategoryColor = (categoryName: string) => {
    const cat = categories.find((c) => c.name === categoryName);
    return cat?.color || "#6b7280";
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });

      if (res.ok) {
        const cat = await res.json();
        setCategories([...categories, cat]);
        setNewCategory({ name: "", color: "#6366f1", type: "expense" });
        setShowCategoryModal(false);
      }
    } catch (error) {
      console.error("Failed to add category:", error);
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
      categoryId: "",
      type: transaction.type as "income" | "expense",
      date: new Date(transaction.date).toISOString().split("T")[0],
      paymentMethod: transaction.paymentMethod || "Credit Card",
      notes: "",
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
            <Tag className="mr-2 h-4 w-4" />
            Categories
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

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
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: transaction.category?.color || "#6b7280" }}
                        />
                        {transaction.category?.name || "Uncategorized"} • {new Date(transaction.date).toLocaleDateString()}
                        {transaction.paymentMethod && ` • ${transaction.paymentMethod}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p
                      className={`font-semibold ${
                        transaction.type === "income" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {format(transaction.amount)}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(transaction)}
                        className="rounded p-1 hover:bg-accent"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="rounded p-1 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Transaction Modal */}
      {(showAddModal || editingTransaction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
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
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Select category</option>
                  {categories
                    .filter((c) => c.parentId === null && (formData.type === "income" ? c.type === "income" : c.type === "expense"))
                    .map((parent) => {
                      const children = categories.filter((c) => c.parentId === parent.id);
                      if (children.length === 0) {
                        return (
                          <option key={parent.id} value={parent.id}>{parent.name}</option>
                        );
                      }
                      return (
                        <optgroup key={parent.id} label={parent.name}>
                          {children.map((child) => (
                            <option key={child.id} value={child.id}>{child.name}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                </select>
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

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg max-h-[80vh] overflow-y-auto">
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
              <h3 className="mb-3 text-sm font-medium">Expense Categories</h3>
              <div className="space-y-2 mb-4">
                {categories.filter((c) => c.type === "expense").map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: cat.color || "#6b7280" }}
                      />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="mb-3 text-sm font-medium">Income Categories</h3>
              <div className="space-y-2">
                {categories.filter((c) => c.type === "income").map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: cat.color || "#6b7280" }}
                      />
                      <span className="text-sm">{cat.name}</span>
                    </div>
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

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
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
    </div>
  );
}
