import { Router } from "express";
import securityChecker, { isAuth } from "../middleware/middleware";
import { checkout } from "../controllers/checkoutController";

const router = Router();

router.post("/", securityChecker, isAuth, checkout);

export default router;
