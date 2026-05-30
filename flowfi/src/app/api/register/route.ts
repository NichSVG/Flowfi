import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Create default categories for the user
    await prisma.category.createMany({
      data: [
        { name: "Food & Dining", icon: "utensils", color: "#ef4444", type: "expense", userId: user.id, isDefault: true },
        { name: "Transportation", icon: "car", color: "#3b82f6", type: "expense", userId: user.id, isDefault: true },
        { name: "Bills & Utilities", icon: "receipt", color: "#f59e0b", type: "expense", userId: user.id, isDefault: true },
        { name: "Entertainment", icon: "film", color: "#8b5cf6", type: "expense", userId: user.id, isDefault: true },
        { name: "Shopping", icon: "shopping-bag", color: "#ec4899", type: "expense", userId: user.id, isDefault: true },
        { name: "Health", icon: "heart", color: "#10b981", type: "expense", userId: user.id, isDefault: true },
        { name: "Education", icon: "book", color: "#6366f1", type: "expense", userId: user.id, isDefault: true },
        { name: "Other", icon: "more-horizontal", color: "#6b7280", type: "expense", userId: user.id, isDefault: true },
        { name: "Salary", icon: "briefcase", color: "#22c55e", type: "income", userId: user.id, isDefault: true },
        { name: "Freelance", icon: "laptop", color: "#14b8a6", type: "income", userId: user.id, isDefault: true },
        { name: "Investments", icon: "trending-up", color: "#0ea5e9", type: "income", userId: user.id, isDefault: true },
        { name: "Other Income", icon: "plus-circle", color: "#84cc16", type: "income", userId: user.id, isDefault: true },
      ],
    });

    return NextResponse.json(
      { message: "User created successfully", user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
