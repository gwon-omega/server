import { Router } from "express";
import { getCart, addItem, updateItem, clearCart } from "../controllers/cartController";
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

// Apply general rate limiting and request size limits to all cart routes
router.use(generalRateLimit);
router.use(requestSizeLimit('5mb'));

// Get user's cart - with ownership verification
router.get("/:userId",
  validateUserId,
  securityChecker,
  isAuth,
  verifyOwnership('userId'),
  getCart
);

// Add item to cart - with input validation
router.post("/add",
  [
    body('productId').isUUID().withMessage('Product ID must be a valid UUID'),
    body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
    body('userId').isUUID().withMessage('User ID must be a valid UUID'),
    handleValidationErrors
  ],
  securityChecker,
  isAuth,
  verifyOwnership('userId'),
  addItem
);

// Update cart item - with input validation
router.put("/update",
  [
    body('productId').isUUID().withMessage('Product ID must be a valid UUID'),
    body('quantity').isInt({ min: 0, max: 99 }).withMessage('Quantity must be between 0 and 99'),
    body('userId').isUUID().withMessage('User ID must be a valid UUID'),
    handleValidationErrors
  ],
  securityChecker,
  isAuth,
  verifyOwnership('userId'),
  updateItem
);

// Clear cart - with user validation
router.post("/clear",
  [
    body('userId').isUUID().withMessage('User ID must be a valid UUID'),
    handleValidationErrors
  ],
  securityChecker,
  isAuth,
  verifyOwnership('userId'),
  clearCart
);

export default router;
