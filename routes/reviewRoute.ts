import express from "express";
import { createReview, getReviews, moderateReview } from "../controllers/reviewController";
import Review from "../database/models/reviewModel";

const router = express.Router();

router.post("/", createReview);
router.get("/", getReviews);
router.put("/:id/moderate", moderateReview);

// One-off normalization endpoint (dev/admin) to map legacy statuses to new vocabulary
router.post("/normalize-status", async (_req, res) => {
	try {
		const [publishedUpdated] = await Review.update({ status: 'published' }, { where: { status: 'enabled' } });
		const [rejectedUpdated] = await Review.update({ status: 'rejected' }, { where: { status: 'disabled' } });
		return res.json({ message: 'normalized', publishedUpdated, rejectedUpdated });
	} catch (e) {
		console.error('normalize-status error', e);
		return res.status(500).json({ message: 'server error' });
	}
});

export default router;
