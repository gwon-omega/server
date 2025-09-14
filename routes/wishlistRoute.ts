import { Router } from "express";
import { addToWishlist, getWishlist, removeFromWishlist } from "../controllers/wishlistController";
import { securityChecker, isAuth } from "../middleware/middleware";

const router = Router();

router.get("/:userId", securityChecker, isAuth, getWishlist);
router.post("/add", securityChecker, isAuth, addToWishlist);
router.post("/remove", securityChecker, isAuth, removeFromWishlist);

export default router;
