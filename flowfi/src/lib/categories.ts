export interface CategoryDef {
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  {
    name: "Housing",
    icon: "home",
    color: "#6366f1",
    subcategories: ["Rent", "Utilities", "Maintenance", "Other"],
  },
  {
    name: "Food & Dining",
    icon: "utensils",
    color: "#ef4444",
    subcategories: [],
  },
  {
    name: "Transportation",
    icon: "car",
    color: "#3b82f6",
    subcategories: ["Fuel", "Public Transport", "Maintenance", "Other"],
  },
  {
    name: "Shopping",
    icon: "shopping-bag",
    color: "#ec4899",
    subcategories: ["Clothing", "Electronics", "Home", "Other"],
  },
  {
    name: "Healthcare",
    icon: "heart",
    color: "#10b981",
    subcategories: ["Medical", "Pharmacy", "Fitness", "Other"],
  },
  {
    name: "Entertainment",
    icon: "gamepad-2",
    color: "#8b5cf6",
    subcategories: [],
  },
  {
    name: "Education",
    icon: "book-open",
    color: "#f59e0b",
    subcategories: [],
  },
  {
    name: "Travel",
    icon: "plane",
    color: "#06b6d4",
    subcategories: ["Transport", "Accommodation", "Other"],
  },
  {
    name: "Bills & Subscriptions",
    icon: "repeat",
    color: "#d946ef",
    subcategories: ["Phone", "Internet", "Streaming", "Software", "Other"],
  },
  {
    name: "Financial",
    icon: "landmark",
    color: "#64748b",
    subcategories: ["Savings", "Investments", "Loans", "Taxes", "Other"],
  },
  {
    name: "Family",
    icon: "users",
    color: "#f97316",
    subcategories: [],
  },
  {
    name: "Gifts & Donations",
    icon: "gift",
    color: "#a855f7",
    subcategories: [],
  },
  {
    name: "Miscellaneous",
    icon: "more-horizontal",
    color: "#6b7280",
    subcategories: [],
  },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  {
    name: "Income",
    icon: "briefcase",
    color: "#22c55e",
    subcategories: ["Salary", "Business", "Investment", "Other"],
  },
];
