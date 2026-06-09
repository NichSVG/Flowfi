import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../src/lib/categories";

config({ path: resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
  console.log("Starting category migration...");

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  console.log(`Found ${users.length} user(s)`);

  for (const user of users) {
    console.log(`\nProcessing user: ${user.email}`);

    const existingCategories = await prisma.category.findMany({
      where: { userId: user.id },
      include: { children: true },
    });

    const existingNames = new Set(existingCategories.map((c) => c.name));

    for (const cat of EXPENSE_CATEGORIES) {
      let parent = existingCategories.find((c) => c.name === cat.name && !c.parentId);

      if (!parent) {
        parent = await prisma.category.create({
          data: {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: "expense",
            userId: user.id,
            isDefault: true,
          },
          include: { children: true },
        });
        console.log(`  Created parent: ${cat.name}`);
      }

      const existingChildren = new Set(
        parent.children.map((c) => c.name)
      );

      const missingSubs = cat.subcategories.filter(
        (sub) => !existingChildren.has(sub) && !existingNames.has(sub)
      );

      if (missingSubs.length > 0) {
        await prisma.category.createMany({
          data: missingSubs.map((subName) => ({
            name: subName,
            icon: cat.icon,
            color: cat.color,
            type: "expense",
            userId: user.id,
            isDefault: true,
            parentId: parent!.id,
          })),
        });
        console.log(`  Added ${missingSubs.length} subcategories to ${cat.name}: ${missingSubs.join(", ")}`);
      }
    }

    for (const cat of INCOME_CATEGORIES) {
      let parent = existingCategories.find((c) => c.name === cat.name && !c.parentId);

      if (!parent) {
        parent = await prisma.category.create({
          data: {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: "income",
            userId: user.id,
            isDefault: true,
          },
          include: { children: true },
        });
        console.log(`  Created parent: ${cat.name}`);
      }

      const existingChildren = new Set(
        parent.children.map((c) => c.name)
      );

      const missingSubs = cat.subcategories.filter(
        (sub) => !existingChildren.has(sub) && !existingNames.has(sub)
      );

      if (missingSubs.length > 0) {
        await prisma.category.createMany({
          data: missingSubs.map((subName) => ({
            name: subName,
            icon: cat.icon,
            color: cat.color,
            type: "income",
            userId: user.id,
            isDefault: true,
            parentId: parent!.id,
          })),
        });
        console.log(`  Added ${missingSubs.length} subcategories to ${cat.name}: ${missingSubs.join(", ")}`);
      }
    }

    console.log(`  Done for ${user.email}`);
  }

  console.log("\nMigration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
