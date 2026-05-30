import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: any = { userId: session.user.id };
    if (category && category !== "All") where.category = { name: category };
    if (type && type !== "all") where.type = type;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, type, description, notes, date, paymentMethod, categoryId } = body;

    if (!amount || !type || !categoryId) {
      return NextResponse.json(
        { error: "Amount, type, and category are required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        description,
        notes,
        date: date ? new Date(date) : new Date(),
        paymentMethod,
        userId: session.user.id,
        categoryId,
      },
      include: { category: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
