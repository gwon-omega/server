import ProductCategory from "../database/models/productCategoryModel";
import sequelize, { connectDB } from "../database/connection";

// Core category taxonomy (extend as needed)
const BASE_CATEGORIES: string[] = [
  "cereals",
  "pulses",
  "vegetables",
  "spices",
  "seeds",
  "fruits",
  "flowers",
  "industrial crops",
  "dairy",
  "honey",
  "medicinal herbs",
];

interface SeedResult {
  created: number;
  skipped: number;
}

export async function seedCategories(extra: string[] = []): Promise<SeedResult> {
  // Clean, trim, and unique
  const list = [...BASE_CATEGORIES, ...extra].map((c) => c.trim()).filter(Boolean);
  const unique = Array.from(new Set(list));

  // Fetch existing categories
  const existing = await ProductCategory.findAll({ attributes: ["categoryName"] });
  const existingSet = new Set(
    existing.map((e) => (e.get("categoryName") as string).toLowerCase())
  );

  // Determine which to create
  const toCreate = unique.filter((c) => !existingSet.has(c.toLowerCase()));

  if (!toCreate.length) {
    return { created: 0, skipped: unique.length };
  }

  await ProductCategory.bulkCreate(
    toCreate.map((name) => ({ categoryName: name })),
    { ignoreDuplicates: true } // Works for MySQL/MariaDB. For Postgres use updateOnDuplicate: ['categoryName']
  );

  return { created: toCreate.length, skipped: unique.length - toCreate.length };
}

// Allow running directly (works in both ts-node ESM & compiled JS)
// Simple direct-run detection without import.meta (works with ts-node transpile-only)
const isDirectRun = process.argv[1] && /seedCategories\.ts$/.test(process.argv[1]);

if (isDirectRun) {
  (async () => {
    try {
      await connectDB({ sync: true });
      const result = await seedCategories();
      console.log("Category seed result:", result);
      await sequelize.close();
    } catch (e) {
      console.error("Category seed failed", e);
      process.exit(1);
    }
  })();
}

export default seedCategories;
