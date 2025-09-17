import { Router } from "express";
import { addToWishlist, getWishlist, removeFromWishlist } from "../controllers/wishlistController";
import {
  securityChecker,
  isAuth,
  generalRateLimit,
  handleValidationErrors,
  verifyOwnership,
  validateUserId
} from "../middleware/middleware";

const router = Router();

// Enhanced security middleware (matching cart route security patterns)
router.get("/:userId",
  securityChecker,
  generalRateLimit,
  validateUserId,
  verifyOwnership('userId'),
  isAuth,
  getWishlist
);

router.post("/add",
  securityChecker,
  generalRateLimit,
  handleValidationErrors,
  isAuth,
  addToWishlist
);

router.post("/remove",
  securityChecker,
  generalRateLimit,
  handleValidationErrors,
  isAuth,
  removeFromWishlist
);

export default router;
