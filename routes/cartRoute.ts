import { Router } from "express";
import rateLimit from 'express-rate-limit';
import { getCart, addItem, updateItem, removeItem, clearCart, syncCart } from "../controllers/cartController";
import {
  securityChecker,
  isAuth,
  verifyOwnership,
  validateUserId,
  handleValidationErrors,
  generalRateLimit,
  requestSizeLimit
} from "../middleware/middleware";
import { body } from "express-validator";

const router = Router();

// Separate rate limiters for read vs write operations
const readCartRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 read requests per minute per IP (very generous for polling)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many cart read requests',
    message: 'Please reduce the frequency of cart requests',
    statusCode: 429
  }
});

// Tighter limiter for add-to-cart abuse mitigation (override general rate limit for this route only)
const addCartRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 add attempts per minute per IP (increased from 30)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many cart add attempts',
    message: 'Please slow down adding items to cart',
    statusCode: 429
  }
});

// Apply request size limits to all cart routes
router.use(requestSizeLimit('5mb'));

// Get user's cart - with ownership verification and generous read rate limit
router.get("/:userId",
  readCartRateLimit, // Use read-specific rate limit instead of general
  validateUserId,
  securityChecker,
  isAuth,
  verifyOwnership('userId'),
  getCart
);

// Add item to cart - with input validation
router.post("/add",
  addCartRateLimit,
  [
    body('productId').isUUID().withMessage('Product ID must be a valid UUID'),
    body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
    body('userId').isUUID().withMessage('User ID must be a valid UUID'),
    body('optimistic').optional().isBoolean().withMessage('Optimistic must be a boolean'),
    handleValidationErrors
  ],
  securityChecker,
  isAuth,
  verifyOwnership('userId'),
  addItem
);

// Update cart item - with input validation and moderate rate limiting
router.put("/update",
  addCartRateLimit, // Use same rate limit as add since it's a write operation
  [
    body('productId').isUUID().withMessage('Product ID must be a valid UUID'),
    body('quantity').isInt({ min: 0, max: 99 }).withMessage('Quantity must be between 0 and 99'),
    body('userId').isUUID().withMessage('User ID must be a valid UUID'),
    body('optimistic').optional().isBoolean().withMessage('Optimistic must be a boolean'),
    handleValidationErrors
  ],
  securityChecker,
  isAuth,
  verifyOwnership('userId'),
  updateItem
);

// Remove item from cart - with input validation
router.delete("/remove",
  addCartRateLimit,
  [
    body('productId').isUUID().withMessage('Product ID must be a valid UUID'),
    body('userId').isUUID().withMessage('User ID must be a valid UUID'),
    body('optimistic').optional().isBoolean().withMessage('Optimistic must be a boolean'),
    handleValidationErrors
  ],
  securityChecker,
  isAuth,
  verifyOwnership('userId'),
  removeItem
);

// Clear cart - with user validation and moderate rate limiting
router.post("/clear",
  addCartRateLimit, // Use same rate limit as add since it's a write operation
  [
    body('userId').isUUID().withMessage('User ID must be a valid UUID'),
    body('optimistic').optional().isBoolean().withMessage('Optimistic must be a boolean'),
    handleValidationErrors
  ],
  securityChecker,
  isAuth,
  verifyOwnership('userId'),
  clearCart
);

// Sync (replace) entire cart - moderate rate limiting
router.post('/sync',
  addCartRateLimit, // Use same rate limit as add since it's a write operation
  [
    body('userId').isUUID().withMessage('User ID must be a valid UUID'),
    body('items').isArray().withMessage('items must be an array'),
    body('optimistic').optional().isBoolean().withMessage('Optimistic must be a boolean'),
    handleValidationErrors
  ],
  securityChecker,
  isAuth,
  verifyOwnership('userId'),
  syncCart
);

export default router;
