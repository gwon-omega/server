import express from "express";
import { createReview, getReviews, moderateReview } from "../controllers/reviewController";

const router = express.Router();

router.post("/", createReview);
router.get("/", getReviews);
router.put("/:id/moderate", moderateReview);

export default router;
