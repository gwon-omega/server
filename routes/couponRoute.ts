import * as express from "express";
import { createCoupon, getCoupons, getCouponById, updateCoupon, deleteCoupon, validateCoupon, getActiveCoupons } from "../controllers/couponController";
import { securityChecker, isAdmin, isAuth, handleValidationErrors } from "../middleware/middleware";
import { body } from "express-validator";
import upload from "../middleware/multerUpload";

const router = express.Router();

// Admin CRUD
router.post("/", securityChecker, isAdmin, upload.single("image"), createCoupon);
router.get("/", securityChecker, isAdmin, getCoupons);
router.get("/:id", securityChecker, isAdmin, getCouponById);
router.put("/:id", securityChecker, isAdmin, upload.single("image"), updateCoupon);
router.delete("/:id", securityChecker, isAdmin, deleteCoupon);

// Public validation for authenticated users
router.post("/validate",
  [
    body('code').notEmpty().withMessage('Coupon code is required'),
    body('orderAmount').optional().isNumeric().withMessage('Order amount must be a number'),
    body('orderTotal').optional().isNumeric().withMessage('Order total must be a number'),
    // Custom validation to ensure at least one total field is provided
    body().custom((body) => {
      if (!body.orderTotal && !body.orderAmount) {
        throw new Error('Either orderTotal or orderAmount is required');
      }
      return true;
    }),
    handleValidationErrors
  ],
  securityChecker,
  isAuth,
  validateCoupon
);

// Public active coupons
router.get("/public/active", getActiveCoupons);

export default router;
