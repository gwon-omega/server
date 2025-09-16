import * as Route from "express";
import { register, login, profile, logout } from "../../controllers/auth/authController";
import { requestPasswordReset, verifyPin, resetPassword } from "../../controllers/auth/forgotController";
import {
  validateEmail,
  validatePassword,
  handleValidationErrors,
  securityChecker,
  isAuth,
  requestSizeLimit
} from "../../middleware/middleware";
import { body } from "express-validator";

const router = Route.Router();

// Apply request size limits to all auth routes
router.use(requestSizeLimit('1mb'));

// Registration with validation
router.post("/register", [
  body('name').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  validateEmail[0], // Extract email validation from array
  validatePassword[0], // Extract password validation from array
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  handleValidationErrors
], register);

// Login with validation
router.post("/login", [
  validateEmail[0],
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
], login);

// Logout with authentication
router.post("/logout", securityChecker, isAuth, logout);

// Profile with authentication
router.get("/profile", securityChecker, isAuth, profile);

// Forgot password flow with validation
router.post("/forgot-password", [
  validateEmail[0],
  handleValidationErrors
], requestPasswordReset);

router.post("/verify-pin", [
  validateEmail[0],
  body('pin').isLength({ min: 6, max: 6 }).isNumeric().withMessage('PIN must be exactly 6 digits'),
  handleValidationErrors
], verifyPin);

router.post("/reset-password", [
  validateEmail[0],
  body('pin').isLength({ min: 6, max: 6 }).isNumeric().withMessage('PIN must be exactly 6 digits'),
  validatePassword[0],
  handleValidationErrors
], resetPassword);

export default router;
