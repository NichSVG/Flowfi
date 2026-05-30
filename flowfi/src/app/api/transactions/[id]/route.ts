import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: { category: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount, type, description, notes, date, paymentMethod, categoryId } = body;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        type,
        description,
        notes,
        date: date ? new Date(date) : undefined,
        paymentMethod,
        categoryId,
      },
      include: { category: true },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
