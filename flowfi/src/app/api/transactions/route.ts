import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addXp, updateStreak, checkAchievements, checkDailyChallenges, XP_REWARDS, ensureUserStats } from "@/lib/gamification";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const rawLimit = searchParams.get("limit");
    const limit = rawLimit ? parseInt(rawLimit) : 0;
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
        ...(limit > 0 ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit: limit || total,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
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

    // Gamification: award XP and update streak
    try {
      await ensureUserStats(session.user.id);
      const xpAmount = type === "income" ? XP_REWARDS.ADD_INCOME : XP_REWARDS.ADD_TRANSACTION;
      await addXp(session.user.id, xpAmount, `transaction:${type}`);
      await prisma.userStats.update({
        where: { userId: session.user.id },
        data: { totalTransactions: { increment: 1 } },
      });
      await updateStreak(session.user.id);
      await checkAchievements(session.user.id);
      await checkDailyChallenges(session.user.id);
    } catch (e) {
      console.error("Gamification error (non-blocking):", e);
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
