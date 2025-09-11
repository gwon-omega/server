import { Op } from "sequelize";
import Product from "../database/models/productModel";
import ProductCategory from "../database/models/productCategoryModel";
import { connectDB } from "../database/connection";

// Reference-based category & product definitions (adapted from provided Supabase script)
interface CategorySeedDef {
  name: string; // canonical category name (spaces allowed)
  slug: string; // slug form (hyphenated)
  products: string[];
}

const CATEGORY_DEFS: CategorySeedDef[] = [
  { name: "cereals", slug: "cereals", products: ["Rice", "Wheat", "Maize", "Barley", "Oats", "Finger Millet", "Foxtail Millet", "Buckwheat", "Sorghum", "Millet Mix"] },
  { name: "pulses", slug: "pulses", products: ["Lentils", "Chickpeas", "Kidney Beans", "Black Beans", "Green Gram", "Soybeans", "Peas", "Pigeon Pea", "Red Lentils", "Mung Beans"] },
  { name: "vegetables", slug: "vegetables", products: ["Tomato", "Potato", "Spinach", "Cabbage", "Cauliflower", "Carrot", "Brinjal", "Radish", "Pumpkin", "Onion"] },
  { name: "spices", slug: "spices", products: ["Turmeric", "Ginger", "Garlic", "Chili Powder", "Cumin", "Coriander", "Fenugreek", "Mustard Seeds", "Cloves", "Cardamom"] },
  { name: "seeds", slug: "seeds", products: ["Sunflower Seeds", "Pumpkin Seeds", "Sesame Seeds", "Mustard Seeds", "Flax Seeds", "Chia Seeds", "Watermelon Seeds", "Coriander Seeds", "Fenugreek Seeds", "Nigella Seeds"] },
  { name: "fruits", slug: "fruits", products: ["Apple", "Banana", "Orange", "Mango", "Papaya", "Pineapple", "Guava", "Pomegranate", "Strawberry", "Lemon"] },
  { name: "flowers", slug: "flowers", products: ["Rose", "Marigold", "Hibiscus", "Jasmine", "Sunflower", "Lily", "Orchid", "Tulip", "Daisy", "Carnation"] },
  // Provided reference used 'industrials-crops'; internal category table uses 'industrial crops'
  { name: "industrial crops", slug: "industrials-crops", products: ["Cotton", "Jute", "Sugarcane", "Rubber", "Hemp", "Tobacco", "Oil Palm", "Coffee", "Tea", "Cocoa"] },
  { name: "dairy", slug: "dairy", products: ["Milk", "Curd", "Cheese", "Butter", "Ghee", "Paneer", "Yogurt", "Buttermilk", "Cream", "Flavored Milk"] },
  { name: "honey", slug: "honey", products: ["Wild Honey", "Organic Honey", "Acacia Honey", "Buckwheat Honey", "Flower Honey", "Forest Honey", "Multiflora Honey", "Raw Honey", "Natural Honey", "Pure Honey"] },
  { name: "medicinal herbs", slug: "medicinal-herbs", products: ["Tulsi", "Ashwagandha", "Neem", "Aloe Vera", "Mint", "Ginger Root", "Turmeric Root", "Lemongrass", "Gotu Kola", "Brahmi"] },
];

// Price ranges keyed by slug (for reproducibility / clarity)
const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  cereals: { min: 50, max: 150 },
  pulses: { min: 60, max: 200 },
  vegetables: { min: 30, max: 100 },
  spices: { min: 100, max: 500 },
  seeds: { min: 150, max: 600 },
  fruits: { min: 50, max: 300 },
  flowers: { min: 100, max: 500 },
  "industrials-crops": { min: 200, max: 800 },
  dairy: { min: 80, max: 300 },
  honey: { min: 500, max: 1500 },
  "medicinal-herbs": { min: 200, max: 800 },
};

const randomPrice = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomQuantity = () => Math.floor(Math.random() * 400) + 50; // 50–449

export interface ProductSeedResult {
  created: number;
  skipped: number;
  categoriesMissing: string[];
}

export async function seedProducts(): Promise<ProductSeedResult> {
  // Load categories from DB once
  const dbCategories = await ProductCategory.findAll();
  const categoryMap = new Map<string, any>(); // lower-case name -> instance
  dbCategories.forEach((c: any) => categoryMap.set(String(c.categoryName).toLowerCase(), c));

  // Preload existing products (names grouped by categoryId) to avoid duplicates
  const existingProducts = await Product.findAll({ attributes: ["productName", "categoryId"], raw: true });
  const existingSet = new Set(
    existingProducts.map((p: any) => `${p.categoryId}::${(p.productName as string).toLowerCase()}`)
  );

  const missingCategories: string[] = [];
  const toCreate: any[] = [];

  for (const def of CATEGORY_DEFS) {
    const key = def.name.toLowerCase();
    const cat = categoryMap.get(key);
    if (!cat) {
      missingCategories.push(def.name);
      continue; // Skip products for missing category
    }
    const range = PRICE_RANGES[def.slug];
    if (!range) continue; // Should not happen; defensive
    for (const productName of def.products) {
      const sig = `${cat.categoryId}::${productName.toLowerCase()}`;
      if (existingSet.has(sig)) continue;
      toCreate.push({
        productName,
        categoryId: cat.categoryId,
        productPrice: randomPrice(range.min, range.max),
        productQuantity: randomQuantity(),
        description: `${productName} from Nepali market.`,
        productDiscount: 0,
      });
    }
  }

  let created = 0;
  if (toCreate.length) {
    const inserted = await Product.bulkCreate(toCreate, { returning: false });
    created = inserted.length || toCreate.length; // returning false may not populate on some dialects
  }

  return { created, skipped: CATEGORY_DEFS.reduce((a, d) => a + d.products.length, 0) - created, categoriesMissing: missingCategories };
}

// Direct run support (mirrors other seed scripts pattern)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  (async () => {
    try {
      await connectDB({ sync: true }); // ensure tables
      const result = await seedProducts();
      console.log("Product seed result", result);
      process.exit(0);
    } catch (e) {
      console.error("Product seed failed", e);
      process.exit(1);
    }
  })();
}

export default seedProducts;
