import { Request, Response } from "express";
import Review from "../database/models/reviewModel";

export const createReview = async (req: Request, res: Response) => {
  try {
    const { email, message, rating } = req.body;
    if (!email || !message) return res.status(400).json({ message: "email and message required" });
    const review = await Review.create({ email, message, rating: rating || 0, status: "pending" });
    return res.status(201).json({ message: "created", review });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    const reviews = await Review.findAll({ where });
    return res.json({ reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const moderateReview = async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // expected published|rejected|pending
    if (!status) return res.status(400).json({ message: "status required" });
    const [count] = await Review.update({ status }, { where: { reviewId: req.params.id } });
    if (!count) return res.status(404).json({ message: "not found" });
    return res.json({ message: "updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export default { createReview, getReviews, moderateReview };
