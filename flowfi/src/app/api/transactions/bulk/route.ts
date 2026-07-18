import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids, categoryId, fromCategoryId, newCategoryId, month } = body;

    if (fromCategoryId && newCategoryId) {
      const where: any = {
        userId: session.user.id,
        categoryId: fromCategoryId,
        type: "expense",
      };

      if (month) {
        const [year, mon] = month.split("-").map(Number);
        const startOfMonth = new Date(year, mon - 1, 1);
        const endOfMonth = new Date(year, mon, 0);
        where.date = { gte: startOfMonth, lte: endOfMonth };
      }

      const result = await prisma.transaction.updateMany({
        where,
        data: { categoryId: newCategoryId },
      });

      return NextResponse.json({ message: `Updated ${result.count} transactions`, count: result.count });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No transaction IDs provided" }, { status: 400 });
    }

    const result = await prisma.transaction.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
      data: {
        categoryId,
      },
    });

    return NextResponse.json({ message: `Updated ${result.count} transactions`, count: result.count });
  } catch (error) {
    console.error("Error bulk updating transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No transaction IDs provided" }, { status: 400 });
    }

    const result = await prisma.transaction.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: `Deleted ${result.count} transactions`, count: result.count });
  } catch (error) {
    console.error("Error bulk deleting transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
