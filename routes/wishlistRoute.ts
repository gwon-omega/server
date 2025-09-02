import Route from "express";
import {
	addToWishlist,
	getWishlist,
	removeFromWishlist,
} from "../controllers/wishlistController";

const router = Route.Router();

router.get("/:userId", getWishlist);
router.post("/add", addToWishlist);
router.post("/remove", removeFromWishlist);

export default router;
