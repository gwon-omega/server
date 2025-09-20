import { Router } from "express";
import rateLimit from 'express-rate-limit';
import { addToWishlist, getWishlist, removeFromWishlist } from "../controllers/wishlistController";
import {
  securityChecker,
  isAuth,
  handleValidationErrors,
  verifyOwnership,
  validateUserId
} from "../middleware/middleware";

const router = Router();

// Separate rate limiters for read vs write operations
const readWishlistRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 read requests per minute per IP (very generous for polling)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many wishlist read requests',
    message: 'Please reduce the frequency of wishlist requests',
    statusCode: 429
  }
});

const writeWishlistRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 write operations per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many wishlist write attempts',
    message: 'Please slow down wishlist modifications',
    statusCode: 429
  }
});

// Enhanced security middleware (matching cart route security patterns)
router.get("/:userId",
  readWishlistRateLimit, // Use read-specific rate limit
  securityChecker,
  validateUserId,
  verifyOwnership('userId'),
  isAuth,
  getWishlist
);

router.post("/add",
  writeWishlistRateLimit, // Use write-specific rate limit
  securityChecker,
  handleValidationErrors,
  isAuth,
  addToWishlist
);

router.post("/remove",
  writeWishlistRateLimit, // Use write-specific rate limit
  securityChecker,
  handleValidationErrors,
  isAuth,
  removeFromWishlist
);

export default router;
