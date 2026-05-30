"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock data
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

const categories = [
  "All",
  "Food & Dining",
  "Transportation",
  "Bills & Utilities",
  "Entertainment",
  "Shopping",
  "Health",
  "Education",
  "Salary",
  "Freelance",
  "Investments",
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<typeof mockTransactions[0] | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Food & Dining",
    type: "expense" as "income" | "expense",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Credit Card",
    notes: "",
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
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
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
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
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
                        {transaction.category} • {transaction.date} • {transaction.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p
                      className={`font-semibold ${
                        transaction.type === "income"
                          ? "text-success"
                          : "text-destructive"
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
              {/* Type Toggle */}
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
                  {categories.filter(c => c !== "All").map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
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
    </div>
  );
}
