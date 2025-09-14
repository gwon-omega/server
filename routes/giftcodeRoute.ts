import { Router } from "express";
import { applyGiftCode, removeGiftCode } from "../controllers/giftcodeController";
import { securityChecker, isAuth } from "../middleware/middleware";

const router = Router();

router.post("/apply", securityChecker, isAuth, applyGiftCode);
router.delete("/remove", securityChecker, isAuth, removeGiftCode);

export default router;
