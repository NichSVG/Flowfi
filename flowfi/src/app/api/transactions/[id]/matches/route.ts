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

    const source = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!source) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const where: any = {
      userId: session.user.id,
      type: source.type,
      NOT: { id },
    };

    const desc = source.description?.trim();
    if (desc) {
      where.description = { equals: desc, mode: "insensitive" };
    } else {
      where.description = null;
    }

    const matches = await prisma.transaction.findMany({
      where,
      select: { id: true, description: true, amount: true, date: true },
    });

    return NextResponse.json({
      count: matches.length,
      ids: matches.map((m) => m.id),
    });
  } catch (error) {
    console.error("Error finding matching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}