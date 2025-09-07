import * as Route from "express";
import { getDashboard } from "../controllers/dashboardController";
import { securityChecker, isAdmin } from "../middleware/middleware";

const router = Route.Router();

// Backwards-compatible simple dashboard

// Backwards-compatible simple dashboard (admin only)
router.get("/", securityChecker, isAdmin, getDashboard);

// Full admin analytics (admin only)
router.get("/admin", securityChecker, isAdmin, getDashboard);

export default router;
