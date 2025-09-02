import { Request, Response } from "express";
import Wishlist from "../database/models/wishlistModel";

export const addToWishlist = async (req: Request, res: Response) => {
	try {
		const { userId, productId } = req.body;
		if (!userId || !productId) return res.status(400).json({ message: "userId and productId required" });
		const existing = await Wishlist.findOne({ where: { userId, productId } });
		if (existing) return res.status(200).json({ message: "already" });
		const w = await Wishlist.create({ userId, productId });
		return res.status(201).json(w);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "server error" });
	}
};

export const getWishlist = async (req: Request, res: Response) => {
	try {
		const userId = req.params.userId || req.query.userId || req.body.userId;
		if (!userId) return res.status(400).json({ message: "userId required" });
		const items = await Wishlist.findAll({ where: { userId } });
		return res.json({ items });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "server error" });
	}
};

export const removeFromWishlist = async (req: Request, res: Response) => {
	try {
		const { userId, productId } = req.body;
		if (!userId || !productId) return res.status(400).json({ message: "userId and productId required" });
		const count = await Wishlist.destroy({ where: { userId, productId } });
		if (!count) return res.status(404).json({ message: "not found" });
		return res.json({ message: "removed" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "server error" });
	}
};

export default { addToWishlist, getWishlist, removeFromWishlist };
