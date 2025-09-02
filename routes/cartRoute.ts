import Route from "express";
import {
	getCart,
	addItem,
	updateItem,
	clearCart,
} from "../controllers/cartController";

const router = Route.Router();

router.get("/:userId", getCart);
router.post("/add", addItem);
router.put("/update", updateItem);
router.post("/clear", clearCart);

export default router;
