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

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // Adjust as needed
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
app.use("/api/categories", productCategoryRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/checkout", checkoutRoute);

// DB + Server
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB({ sync: true }); // explicit - dev only
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB error", err);
    process.exit(1);
  }
})();
