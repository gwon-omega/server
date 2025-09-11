import { Router } from "express";
import { submitContact, listContacts, getContact, updateStatus, replyContact } from "../controllers/contactController";
import securityChecker, { isAdmin } from "../middleware/middleware";

const router = Router();

// Public submission
router.post("/", submitContact);

// Admin endpoints
router.get("/", securityChecker, isAdmin, listContacts);
router.get("/:id", securityChecker, isAdmin, getContact);
router.patch("/:id/status", securityChecker, isAdmin, updateStatus);
router.post("/:id/reply", securityChecker, isAdmin, replyContact);

export default router;

