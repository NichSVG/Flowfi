"use client";

import { useState } from "react";
import { User, Mail, Lock, Bell, Moon, Sun, LogOut, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { signOut } from "next-auth/react";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    budgetAlerts: true,
    goalUpdates: true,
    weeklyReport: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch {
      alert("An error occurred. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary">
                <span className="text-3xl font-bold text-primary-foreground">J</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="text-muted-foreground">{email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleSaveProfile} loading={saving}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Connected Accounts</p>
                      <p className="text-sm text-muted-foreground">Google, GitHub</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Card */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Sun className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-muted-foreground">
                        Currently using {theme} mode
                      </p>
                    </div>
                  </div>
                  <div className="flex rounded-lg border border-border">
                    <button
                      onClick={() => setTheme("light")}
                      className={`px-3 py-1.5 text-sm ${
                        theme === "light" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`px-3 py-1.5 text-sm ${
                        theme === "dark" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme("system")}
                      className={`px-3 py-1.5 text-sm ${
                        theme === "system" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      System
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries({
                email: "Email Notifications",
                push: "Push Notifications",
                budgetAlerts: "Budget Alerts",
                goalUpdates: "Goal Updates",
                weeklyReport: "Weekly Report",
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={notifications[key as keyof typeof notifications]}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          [key]: e.target.checked,
                        })
                      }
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none" />
                  </label>
                </div>
              ))}
              <Button onClick={handleSaveNotifications} loading={saving} variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card variant="bordered" className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Delete Account
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently delete your account, all transactions, budgets,
              goals, and categories. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteAccount}
                loading={deleting}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
