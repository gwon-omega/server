import * as Route from "express";
import { register, login, profile, logout } from "../../controllers/auth/authController";
import { requestPasswordReset, verifyPin, resetPassword } from "../../controllers/auth/forgotController";

const router = Route.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", profile);

// Forgot password flow
router.post("/forgot-password", requestPasswordReset);
router.post("/verify-pin", verifyPin);
router.post("/reset-password", resetPassword);

export default router;
