import { Router } from "express";
import { getCart, addItem, updateItem, clearCart } from "../controllers/cartController";
import { securityChecker, isAuth } from "../middleware/middleware";

const router = Router();

router.get("/:userId", securityChecker, isAuth, getCart);
router.post("/add", securityChecker, isAuth, addItem);
router.put("/update", securityChecker, isAuth, updateItem);
router.post("/clear", securityChecker, isAuth, clearCart);

export default router;
