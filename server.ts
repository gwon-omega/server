import express from "express";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { maintenanceMode } from './middleware/maintenanceMode';
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
import transcriptRoute from "./routes/transcriptRoute";
import eventsRoute from "./routes/eventsRoute";
import ProductCategory from "./database/models/productCategoryModel";
// Ensure Contact model is registered before sync so its table exists
import "./database/models/contactModel";
import { seedCategories } from "./scripts/seedCategories";
// Register job processors (cart, etc.) - DISABLED due to cart normalization
// Cart background job processors - DISABLED for production
import "./events/cartJobs";
import {
  securityHeaders,
  requestLogger,
  formatErrorResponse,
  authRateLimit
} from "./middleware/middleware";

const app = express();

// Security headers (should be first)
app.use(securityHeaders);

// Maintenance mode (must run before other route handlers)
app.use(maintenanceMode);

// Request logging
app.use(requestLogger);

// CORS with enhanced security
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Origin not allowed'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes with appropriate rate limiting
app.use("/api/auth", authRateLimit, authRoute);
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
app.use("/api/transcripts", transcriptRoute);
app.use("/api/events", eventsRoute);

// Static file serving for uploads (e.g., generated transcripts)
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// DB + Server
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // Step 1: Connect to database with sync (migrations removed as requested)
    await connectDB({ sync: true }); // explicit - dev only

    // Step 2: Seed categories if empty
    const catCount = await ProductCategory.count();
    if (catCount === 0) {
      const result = await seedCategories();
      console.log("Seeded base categories", result);
    }

    // Step 3: Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB error", err);
    process.exit(1);
  }
})();

// Fallback 404 - Enhanced with proper error format
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
});

// Global error handler - Enhanced with structured error handling
app.use(formatErrorResponse);
