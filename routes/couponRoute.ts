import * as express from "express";
import { createCoupon, getCoupons, getCouponById, updateCoupon, deleteCoupon, validateCoupon } from "../controllers/couponController";
import { securityChecker, isAdmin, isAuth } from "../middleware/middleware";

const router = express.Router();

// Admin CRUD
router.post("/", securityChecker, isAdmin, createCoupon);
router.get("/", securityChecker, isAdmin, getCoupons);
router.get("/:id", securityChecker, isAdmin, getCouponById);
router.put("/:id", securityChecker, isAdmin, updateCoupon);
router.delete("/:id", securityChecker, isAdmin, deleteCoupon);

// Public validation for authenticated users
router.post("/validate", securityChecker, isAuth, validateCoupon);

export default router;
