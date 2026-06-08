"use client";

import { useState } from "react";
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

const defaultCategories = [
  { name: "Food & Dining", color: "#ef4444", type: "expense" },
  { name: "Transportation", color: "#3b82f6", type: "expense" },
  { name: "Bills & Utilities", color: "#f59e0b", type: "expense" },
  { name: "Entertainment", color: "#8b5cf6", type: "expense" },
  { name: "Shopping", color: "#ec4899", type: "expense" },
  { name: "Health", color: "#10b981", type: "expense" },
  { name: "Education", color: "#6366f1", type: "expense" },
  { name: "Salary", color: "#22c55e", type: "income" },
  { name: "Freelance", color: "#14b8a6", type: "income" },
  { name: "Investments", color: "#0ea5e9", type: "income" },
];

const mockTransactions = [
  { id: 1, description: "Grocery Store", amount: 85.50, category: "Food & Dining", date: "2024-01-15", type: "expense", paymentMethod: "Credit Card" },
  { id: 2, description: "Monthly Salary", amount: 5200.00, category: "Salary", date: "2024-01-15", type: "income", paymentMethod: "Bank Transfer" },
  { id: 3, description: "Electric Bill", amount: 120.00, category: "Bills & Utilities", date: "2024-01-14", type: "expense", paymentMethod: "Bank Transfer" },
  { id: 4, description: "Freelance Work", amount: 850.00, category: "Freelance", date: "2024-01-13", type: "income", paymentMethod: "PayPal" },
  { id: 5, description: "Restaurant", amount: 45.00, category: "Food & Dining", date: "2024-01-13", type: "expense", paymentMethod: "Debit Card" },
  { id: 6, description: "Gas Station", amount: 55.00, category: "Transportation", date: "2024-01-12", type: "expense", paymentMethod: "Credit Card" },
  { id: 7, description: "Netflix Subscription", amount: 15.99, category: "Entertainment", date: "2024-01-12", type: "expense", paymentMethod: "Credit Card" },
  { id: 8, description: "Gym Membership", amount: 49.99, category: "Health", date: "2024-01-11", type: "expense", paymentMethod: "Debit Card" },
  { id: 9, description: "Online Course", amount: 29.99, category: "Education", date: "2024-01-10", type: "expense", paymentMethod: "Credit Card" },
  { id: 10, description: "Investment Return", amount: 150.00, category: "Investments", date: "2024-01-10", type: "income", paymentMethod: "Bank Transfer" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [categories, setCategories] = useState(defaultCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ message: string; count: number; errors?: string[] } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<typeof mockTransactions[0] | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Food & Dining",
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

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesType = selectedType === "all" || t.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCategoryColor = (categoryName: string) => {
    const cat = categories.find((c) => c.name === categoryName);
    return cat?.color || "#6b7280";
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    
    const categoryExists = categories.some(
      (c) => c.name.toLowerCase() === newCategory.name.trim().toLowerCase()
    );
    
    if (categoryExists) {
      alert("Category already exists!");
      return;
    }

    setCategories([
      ...categories,
      {
        name: newCategory.name.trim(),
        color: newCategory.color,
        type: newCategory.type,
      },
    ]);
    
    setNewCategory({ name: "", color: "#6366f1", type: "expense" });
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (categoryName: string) => {
    const isUsed = transactions.some((t) => t.category === categoryName);
    if (isUsed) {
      alert("Cannot delete category that is used in transactions!");
      return;
    }
    setCategories(categories.filter((c) => c.name !== categoryName));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

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
      } else {
        setUploadResult({
          message: data.error || "Upload failed",
          count: 0,
          errors: data.details,
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

  const handleAddTransaction = () => {
    const newTransaction = {
      id: Date.now(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      type: formData.type,
      paymentMethod: formData.paymentMethod,
    };
    setTransactions([newTransaction, ...transactions]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditTransaction = () => {
    if (!editingTransaction) return;
    const updatedTransactions = transactions.map((t) =>
      t.id === editingTransaction.id
        ? {
            ...t,
            description: formData.description,
            amount: parseFloat(formData.amount),
            category: formData.category,
            type: formData.type,
            date: formData.date,
            paymentMethod: formData.paymentMethod,
          }
        : t
    );
    setTransactions(updatedTransactions);
    setEditingTransaction(null);
    resetForm();
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "Food & Dining",
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Credit Card",
      notes: "",
    });
  };

  const openEditModal = (transaction: typeof mockTransactions[0]) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      type: transaction.type as "income" | "expense",
      date: transaction.date,
      paymentMethod: transaction.paymentMethod,
      notes: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filters */}
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
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
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

      {/* Transactions List */}
      <Card variant="bordered">
        <CardContent className="pt-6">
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No transactions found
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
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: getCategoryColor(transaction.category) }}
                        />
                        {transaction.category} • {transaction.date} • {transaction.paymentMethod}
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
                      {formatCurrency(transaction.amount)}
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
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                >
                  {categories
                    .filter((c) => formData.type === "income" ? c.type === "income" : c.type === "expense")
                    .map((cat) => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  + Add new category
                </button>
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
                  <option value="PayPal">PayPal</option>
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
                  disabled={!formData.description || !formData.amount}
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

            {/* Add New Category */}
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

            {/* Existing Categories */}
            <div>
              <h3 className="mb-3 text-sm font-medium">Expense Categories</h3>
              <div className="space-y-2 mb-4">
                {categories.filter((c) => c.type === "expense").map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.name)}
                      className="rounded p-1 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>

              <h3 className="mb-3 text-sm font-medium">Income Categories</h3>
              <div className="space-y-2">
                {categories.filter((c) => c.type === "income").map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.name)}
                      className="rounded p-1 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
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
                  Upload a CSV or PDF bank statement. Categories will be auto-detected based on transaction descriptions.
                </p>

                <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="mb-2 text-sm font-medium">
                    Drop your CSV or PDF file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Supports: CSV and PDF bank statements
                  </p>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    {uploading ? "Uploading..." : "Choose File"}
                    <input
                      type="file"
                      accept=".csv,.pdf"
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

                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs font-medium mb-2">Auto-detected categories:</p>
                  <div className="flex flex-wrap gap-1">
                    {["Food & Dining", "Transportation", "Shopping", "Bills & Utilities", "Entertainment"].map((cat) => (
                      <span key={cat} className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                        {cat}
                      </span>
                    ))}
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

                {uploadResult.errors && uploadResult.errors.length > 0 && (
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
