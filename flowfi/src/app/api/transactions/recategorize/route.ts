import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_KEYWORDS } from "@/lib/category-keywords";
import { extractMerchantName, searchMerchantCategory } from "@/lib/merchant-search";

function detectCategoryFromKeywords(text: string): { category: string; subcategory?: string; parentCategory?: string } | null {
  const lower = text.toLowerCase();

  for (const [category, data] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of data.keywords) {
      if (keyword && lower.includes(keyword)) {
        return { category, subcategory: data.subcategory, parentCategory: data.parent };
      }
    }
  }

  return null;
}

async function detectCategory(description: string, type: string): Promise<{ category: string; subcategory?: string; parentCategory?: string }> {
  // Step 1: Try matching full description against keywords
  const fullMatch = detectCategoryFromKeywords(description);
  if (fullMatch) return fullMatch;

  // Step 2: Extract merchant name and try matching that
  const merchant = extractMerchantName(description);
  if (merchant !== description) {
    const merchantMatch = detectCategoryFromKeywords(merchant);
    if (merchantMatch) return merchantMatch;
  }

  // Step 3: Web search fallback for unknown merchants (skip GoPayID - no merchant info)
  if (type === "expense" && merchant.length > 2 && merchant !== "GoPayID") {
    const searchResult = await searchMerchantCategory(merchant);
    if (searchResult) return searchResult;
  }

  return { category: type === "income" ? "Income" : "Miscellaneous" };
}

function resolveCategoryId(
  categoryName: string,
  subcategory: string | undefined,
  parentCategory: string | undefined,
  type: string,
  categoryMap: Map<string, string>
): string | undefined {
  if (subcategory) {
    if (parentCategory) {
      const combined = categoryMap.get(`${parentCategory}:${subcategory}`);
      if (combined) return combined;
    }
    const id = categoryMap.get(subcategory);
    if (id) return id;
  }
  if (parentCategory) {
    const id = categoryMap.get(parentCategory);
    if (id) return id;
  }
  if (categoryName) {
    const id = categoryMap.get(categoryName);
    if (id) return id;
  }
  return categoryMap.get(type === "income" ? "Income" : "Miscellaneous");
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Build category map
    const allCategories = await prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { isDefault: true },
        ],
      },
    });

    // Create missing subcategories if they don't exist
    const financialParent = allCategories.find(c => c.name === "Financial" && (c.userId === userId || c.isDefault));
    const missingSubcats = ["E-Wallet", "Bank Fees"];
    for (const subcatName of missingSubcats) {
      const exists = allCategories.some(c => c.name === subcatName && (c.userId === userId || c.isDefault));
      if (!exists && financialParent) {
        const newCat = await prisma.category.create({
          data: {
            name: subcatName,
            type: "expense",
            userId,
            parentId: financialParent.id,
            isDefault: false,
            color: financialParent.color,
          },
        });
        allCategories.push(newCat);
      }
    }

    const categoryMap = new Map<string, string>();
    for (const cat of allCategories) {
      categoryMap.set(cat.name, cat.id);
    }
    for (const cat of allCategories) {
      if (cat.parentId) {
        const parent = allCategories.find((p) => p.id === cat.parentId);
        if (parent) {
          categoryMap.set(`${parent.name}:${cat.name}`, cat.id);
        }
      }
    }

    // Fetch all transactions for the user
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "asc" },
    });

    let updated = 0;
    let skipped = 0;
    const changes: Array<{ description: string; from: string; to: string }> = [];

    for (const txn of transactions) {
      const currentCategory = txn.category?.name || "Unknown";

      // Re-detect category
      const detected = await detectCategory(txn.description || "", txn.type);
      const newCategoryId = resolveCategoryId(detected.category, detected.subcategory, detected.parentCategory, txn.type, categoryMap);

      if (newCategoryId && newCategoryId !== txn.categoryId) {
        // Check if we're actually changing to a better category
        const newCat = allCategories.find(c => c.id === newCategoryId);
        const newCatName = newCat?.name || "Unknown";

        // Don't downgrade from a specific category to Miscellaneous
        if (newCatName === "Miscellaneous" && currentCategory !== "Miscellaneous") {
          skipped++;
          continue;
        }

        await prisma.transaction.update({
          where: { id: txn.id },
          data: {
            categoryId: newCategoryId,
            notes: detected.subcategory
              ? `${detected.parentCategory || detected.category} > ${detected.subcategory}`
              : detected.category,
          },
        });

        changes.push({
          description: (txn.description || "").substring(0, 60),
          from: currentCategory,
          to: newCatName,
        });

        updated++;
      }
    }

    return NextResponse.json({
      message: `Re-categorized ${updated} of ${transactions.length} transactions`,
      total: transactions.length,
      updated,
      skipped,
      changes: changes.slice(0, 50),
    });
  } catch (error) {
    console.error("Error re-categorizing transactions:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
