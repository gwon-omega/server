import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize, { connectDB } from "./database/connection";
import authRoute from "./routes/auth/authRoute";
import productRoute from "./routes/productRoute";
import userRoute from "./routes/userRoute";
import cartRoute from "./routes/cartRoute";
import wishlistRoute from "./routes/wishlistRoute";
import orderRoute from "./routes/orderRoute";
import reviewRoute from "./routes/reviewRoute";
import productCategoryRoute from "./routes/productCategoryRoute";
import paymentRoute from "./routes/paymentRoute";
import dashboardRoute from "./routes/dashboardRoute";
import checkoutRoute from "./routes/checkoutRoute";
import contactRoute from "./routes/contactRoute";
import couponRoute from "./routes/couponRoute";
import giftcodeRoute from "./routes/giftcodeRoute";
import ProductCategory from "./database/models/productCategoryModel";
import { seedCategories } from "./scripts/seedCategories";
import { migrateCartTable, migrateWishlistTable } from "./scripts/migrateCartTable";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"], // Support both ports
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/users", userRoute);
app.use("/api/cart", cartRoute);
app.use("/api/wishlist", wishlistRoute);
app.use("/api/orders", orderRoute);
app.use("/api/reviews", reviewRoute);
// Backward compatibility: expose both /categories and /product-categories
app.use("/api/categories", productCategoryRoute);
app.use("/api/product-categories", productCategoryRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/checkout", checkoutRoute);
app.use("/api/contact", contactRoute);
app.use("/api/coupons", couponRoute);
app.use("/api/giftcode", giftcodeRoute);

// DB + Server
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // Step 1: Run database migrations first
    console.log("🔄 Running database migrations...");
    await migrateCartTable();
    await migrateWishlistTable();
    console.log("✅ All migrations completed successfully");

    // Step 2: Connect to database with sync
    await connectDB({ sync: true }); // explicit - dev only

    // Step 3: Seed categories if empty
    const catCount = await ProductCategory.count();
    if (catCount === 0) {
      const result = await seedCategories();
      console.log("Seeded base categories", result);
    }

    // Step 4: Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB error", err);
    process.exit(1);
  }
})();

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ message: "not found" });
});

// Global error handler (Express 5 has built-in route async handling)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error", err);
  res.status(500).json({ message: "internal error" });
});
