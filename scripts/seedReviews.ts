import { Op } from "sequelize";
import Review from "../database/models/reviewModel";
import Product from "../database/models/productModel";
import { connectDB } from "../database/connection";

// Sample Nepali names
const nepaliNames = [
  "Suman Shrestha", "Asha Gurung", "Ramesh Thapa", "Gita Magar", "Anil Koirala",
  "Pooja Lama", "Binod Adhikari", "Sita Tamang", "Prakash Rai", "Maya KC",
  "Rajesh Pandey", "Sunita Shahi", "Dipak Bhatt", "Kiran Chettri", "Nisha Rai",
  "Hari Ghimire", "Sonal Shrestha", "Rajan Magar", "Bina Thapa", "Manoj Gurung",
  "Sujan Lama", "Rina Koirala", "Sanjeev Adhikari", "Rekha Tamang", "Bibek KC",
  "Mina Pandey", "Pawan Shahi", "Sabina Bhatt", "Krishna Rai", "Sarita Magar"
];

// Sample comments
const sampleComments = [
  "Very good quality!", "Satisfied with the product.", "Could be better.",
  "Excellent, will buy again.", "Not worth the price.", "Highly recommend!",
  "Delivery was late but product is good.", "Packaging was poor.",
  "Amazing product!", "Average quality."
];

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomRating = () => Math.floor(Math.random() * 5) + 1; // 1-5 stars

export async function seedReviews(): Promise<{ created: number; skipped: number; }> {
  // Get 10 random product IDs from DB
  const products = await Product.findAll({ attributes: ["productId"], raw: true, limit: 10 });
  const productIds = products.map((p: any) => p.productId);
  if (productIds.length === 0) throw new Error("No products found to seed reviews.");

  // Preload existing reviews (by email+message+productId) to avoid duplicates
  const existing = await Review.findAll({ attributes: ["email", "message", "reviewId"], raw: true });
  const existingSet = new Set(existing.map((r: any) => `${r.email}::${r.message}`));

  const toCreate: any[] = [];
  for (const name of nepaliNames) {
    const email = name.toLowerCase().replace(/\s+/g, ".") + "@example.com";
    const message = randomItem(sampleComments);
    const productId = randomItem(productIds);
    const sig = `${email}::${message}`;
    if (existingSet.has(sig)) continue;
    toCreate.push({
      email,
      message,
      rating: randomRating(),
      status: "enabled",
      productId,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)),
      updatedAt: new Date(),
    });
  }
  let created = 0;
  if (toCreate.length) {
    const inserted = await Review.bulkCreate(toCreate, { returning: false });
    created = inserted.length || toCreate.length;
  }
  return { created, skipped: nepaliNames.length - created };
}

// Direct run support
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  (async () => {
    try {
      await connectDB({ sync: true });
      const result = await seedReviews();
      console.log("Review seed result", result);
      process.exit(0);
    } catch (e) {
      console.error("Review seed failed", e);
      process.exit(1);
    }
  })();
}

export default seedReviews;
