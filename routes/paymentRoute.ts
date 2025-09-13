import * as Route from "express";
import { validateEsewa, initiateKhalti, esewaWebhook, khaltiWebhook, listPayments } from "../controllers/paymentController";
import { securityChecker } from "../middleware/middleware";

const router = Route.Router();

// Protected initiation endpoints (require API key or JWT)
router.post("/esewa/validate", securityChecker, validateEsewa);
router.post("/khalti/initiate", securityChecker, initiateKhalti);

// Public webhook endpoints (providers will call these)
router.post("/webhook/esewa", Route.json(), esewaWebhook);
router.post("/webhook/khalti", Route.json(), khaltiWebhook);

// List payments (authenticated)
router.get("/", securityChecker, listPayments);

export default router;
