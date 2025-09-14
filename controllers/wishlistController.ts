import { Request, Response } from "express";
import Wishlist from "../database/models/wishlistModel";

// Helper to extract userId from JWT (auth middleware sets (req as any).user)
const getUserId = (req: Request) => (req as any).user?.id;

export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!productId) return res.status(400).json({ message: "productId is required" });

    const existing = await Wishlist.findOne({ where: { userId, productId } });
    if (existing) return res.status(200).json({ message: "Product already in wishlist" });

    const wishlistItem = await Wishlist.create({ userId, productId });
    return res.status(201).json({ message: "Added to wishlist", item: wishlistItem });
  } catch (error) {
    console.error("addToWishlist error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const items = await Wishlist.findAll({ where: { userId } });
    return res.status(200).json({ items });
  } catch (error) {
    console.error("getWishlist error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!productId) return res.status(400).json({ message: "productId is required" });

    const deletedCount = await Wishlist.destroy({ where: { userId, productId } });
    if (!deletedCount) return res.status(404).json({ message: "Product not found in wishlist" });

    return res.status(200).json({ message: "Removed from wishlist" });
  } catch (error) {
    console.error("removeFromWishlist error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default { addToWishlist, getWishlist, removeFromWishlist };
