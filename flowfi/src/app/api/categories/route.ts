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
    const type = searchParams.get("type");
    const flat = searchParams.get("flat");

    const where: any = {
      OR: [
        { userId: session.user.id },
        { isDefault: true, userId: null },
      ],
    };

    if (type) {
      where.type = type;
    }

    if (flat === "true") {
      const categories = await prisma.category.findMany({
        where,
        orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      });

      // Dedupe by (normalized name + type + parentId bucket). A user may end
      // up with both a user-scoped category and a global isDefault one with
      // the same name (e.g. two "Entertainment" rows with different IDs);
      // returning both makes the pie-chart recategorize dropdown pick an
      // alternate ID and silently create a second slice. Prefer the
      // user-owned row; fall back to the oldest.
      const dedup = new Map<string, typeof categories[number]>();
      for (const cat of categories) {
        const parentKey = cat.parentId ?? "<root>";
        const key = `${cat.name.toLowerCase().trim()}|${cat.type}|${parentKey}`;
        const existing = dedup.get(key);
        if (!existing) {
          dedup.set(key, cat);
          continue;
        }
        const catIsUserOwned = cat.userId != null;
        const existingIsUserOwned = existing.userId != null;
        if (catIsUserOwned && !existingIsUserOwned) {
          dedup.set(key, cat);
        }
      }
      return NextResponse.json(Array.from(dedup.values()));
    }

    const parentCategories = await prisma.category.findMany({
      where: {
        ...where,
        parentId: null,
      },
      include: {
        children: {
          where: {
            OR: [
              { userId: session.user.id },
              { isDefault: true, userId: null },
            ],
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Same dedup for parent categories: collapse parents that share a name
    // (case-insensitive) across user-scoped + global default rows.
    const dedupedParents = new Map<string, typeof parentCategories[number]>();
    for (const cat of parentCategories) {
      const key = `${cat.name.toLowerCase().trim()}|${cat.type}`;
      const existing = dedupedParents.get(key);
      if (!existing) {
        dedupedParents.set(key, cat);
        continue;
      }
      const catIsUserOwned = cat.userId != null;
      const existingIsUserOwned = existing.userId != null;
      if (catIsUserOwned && !existingIsUserOwned) {
        // Preserve the children list on the canonical entry.
        dedupedParents.set(key, { ...cat, children: cat.children });
      } else if (existingIsUserOwned === catIsUserOwned) {
        // Same ownership tier — merge children to avoid duplicate subcats.
        const mergedChildren = new Map<string, typeof cat.children[number]>();
        for (const ch of [...existing.children, ...cat.children]) {
          const ckey = ch.name.toLowerCase().trim();
          if (!mergedChildren.has(ckey)) {
            const chIsUserOwned = ch.userId != null;
            const existingCh = mergedChildren.get(ckey);
            if (!existingCh || (chIsUserOwned && existingCh.userId == null)) {
              mergedChildren.set(ckey, ch);
            }
          }
        }
        dedupedParents.set(key, {
          ...existing,
          children: Array.from(mergedChildren.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        });
      }
    }
    return NextResponse.json(Array.from(dedupedParents.values()));
  } catch (error) {
    console.error("Error fetching categories:", error);
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
    const { name, icon, color, type, parentId } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
        type,
        OR: [
          { userId: session.user.id },
          { isDefault: true, userId: null },
        ],
        parentId: parentId || null,
      },
    });

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        icon,
        color,
        type,
        userId: session.user.id,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
