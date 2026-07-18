"use client";

import Link from "next/link";
import { ArrowRight, PieChart, Wallet, Target, Bell } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-3xl text-center">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">F</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">FlowFi</h1>
        </div>

        <p className="mb-8 sm:mb-12 text-base sm:text-xl text-muted-foreground">
          Track expenses, manage budgets, and achieve your financial goals with ease.
        </p>

        {/* Features */}
        <div className="mb-10 sm:mb-12 grid gap-4 sm:gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-4 sm:p-6 text-left">
            <Wallet className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-semibold">Track Expenses</h3>
            <p className="text-sm text-muted-foreground">
              Easily log and categorize your income and expenses
            </p>
          </div>
          <div className="rounded-xl border border-border p-4 sm:p-6 text-left">
            <PieChart className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-semibold">Smart Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Visualize spending patterns with beautiful charts
            </p>
          </div>
          <div className="rounded-xl border border-border p-4 sm:p-6 text-left">
            <Target className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-semibold">Savings Goals</h3>
            <p className="text-sm text-muted-foreground">
              Set and track progress towards your financial goals
            </p>
          </div>
          <div className="rounded-xl border border-border p-4 sm:p-6 text-left">
            <Bell className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-semibold">Budget Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Get notified when you&apos;re approaching your limits
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium hover:bg-accent"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
