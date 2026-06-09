import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";

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
        name: name || email.split("@")[0],
        email,
        password: hashedPassword,
      },
    });

    for (const cat of EXPENSE_CATEGORIES) {
      const parent = await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: "expense",
          userId: user.id,
          isDefault: true,
        },
      });

      if (cat.subcategories.length > 0) {
        await prisma.category.createMany({
          data: cat.subcategories.map((subName) => ({
            name: subName,
            icon: cat.icon,
            color: cat.color,
            type: "expense",
            userId: user.id,
            isDefault: true,
            parentId: parent.id,
          })),
        });
      }
    }

    for (const cat of INCOME_CATEGORIES) {
      const parent = await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: "income",
          userId: user.id,
          isDefault: true,
        },
      });

      if (cat.subcategories.length > 0) {
        await prisma.category.createMany({
          data: cat.subcategories.map((subName) => ({
            name: subName,
            icon: cat.icon,
            color: cat.color,
            type: "income",
            userId: user.id,
            isDefault: true,
            parentId: parent.id,
          })),
        });
      }
    }

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
