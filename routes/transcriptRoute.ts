import { Router } from "express";
import securityChecker, { isAuth } from "../middleware/middleware";
import { generateForOrder, getTranscript, downloadTranscript } from "../controllers/transcriptController";

const router = Router();

// Generate a transcript PDF for an order
router.post("/generate", securityChecker, isAuth, generateForOrder);

// Get transcript metadata
router.get("/:id", securityChecker, isAuth, getTranscript);

// Download transcript PDF
router.get("/:id/download", securityChecker, isAuth, downloadTranscript);

export default router;
