import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      preferences: preferences || {
        dashboardWidgets: ["streak", "xp", "challenges", "insights", "health_score"],
        reminderEnabled: true,
      },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { dashboardWidgets, reminderEnabled } = body;

    const preferences = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        dashboardWidgets,
        reminderEnabled,
      },
      update: {
        dashboardWidgets,
        reminderEnabled,
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
