import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, color, icon } = body;

    const category = await prisma.category.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found or you do not have permission to edit it" },
        { status: 404 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        userId: session.user.id,
        parentId: category.parentId,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        color: color ?? undefined,
        icon: icon ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating category:", error);
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

    const category = await prisma.category.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found or you do not have permission to delete it" },
        { status: 404 }
      );
    }

    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${transactionCount} transaction(s). Reassign or delete those transactions first.`,
        },
        { status: 400 }
      );
    }

    const childCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a category that has subcategories. Delete them first." },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}