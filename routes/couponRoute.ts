import * as express from "express";
import { createCoupon, getCoupons, getCouponById, updateCoupon, deleteCoupon, validateCoupon, getActiveCoupons } from "../controllers/couponController";
import { securityChecker, isAdmin, isAuth } from "../middleware/middleware";
import upload from "../middleware/multerUpload";

const router = express.Router();

// Admin CRUD
router.post("/", securityChecker, isAdmin, upload.single("image"), createCoupon);
router.get("/", securityChecker, isAdmin, getCoupons);
router.get("/:id", securityChecker, isAdmin, getCouponById);
router.put("/:id", securityChecker, isAdmin, upload.single("image"), updateCoupon);
router.delete("/:id", securityChecker, isAdmin, deleteCoupon);

// Public validation for authenticated users
router.post("/validate", securityChecker, isAuth, validateCoupon);

// Public active coupons
router.get("/public/active", getActiveCoupons);

export default router;
