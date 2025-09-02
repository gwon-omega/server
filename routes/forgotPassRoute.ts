import * as Route from "express";
import { requestPasswordReset, verifyPin, resetPassword } from "../controllers/auth/forgotController";

const router = Route.Router();

router.post("/forgot-password", requestPasswordReset);
router.post("/verify-pin", verifyPin);
router.post("/reset-password", resetPassword);

export default router;
