import { Request, Response } from "express";
import Wishlist from "../database/models/wishlistModel";
import { validateUuid } from "../utils/validation";

// Helper to extract userId from JWT (auth middleware sets (req as any).user)
const getUserId = (req: Request) => (req as any).user?.userId || (req as any).user?.id;

export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.body;

    // Enhanced validation
    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User must be authenticated to access wishlist",
        statusCode: 401
      });
    }

    if (!productId) {
      return res.status(400).json({
        error: "Validation failed",
        message: "productId is required",
        statusCode: 400
      });
    }

    // Validate UUID format
    if (!validateUuid(productId)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "productId must be a valid UUID",
        statusCode: 400
      });
    }

    // Check if product already in wishlist
    const existing = await Wishlist.findOne({ where: { userId, productId } });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Product already in wishlist",
        item: existing
      });
    }

    // Create new wishlist item
    const wishlistItem = await Wishlist.create({ userId, productId });
    return res.status(201).json({
      success: true,
      message: "Added to wishlist successfully",
      item: wishlistItem
    });

  } catch (error: any) {
    console.error("addToWishlist error:", error);

    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: "Duplicate entry",
        message: "Product is already in wishlist",
        statusCode: 400
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        error: "Invalid reference",
        message: "Product or user does not exist",
        statusCode: 400
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to add product to wishlist",
      statusCode: 500
    });
  }
};

export const getWishlist = async (req: Request, res: Response) => {
  try {
    const jwtUserId = getUserId(req);
    const urlUserId = req.params.userId;

    if (!jwtUserId) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User must be authenticated to access wishlist",
        statusCode: 401
      });
    }

    // Validate UUID format
    if (!validateUuid(urlUserId)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "userId must be a valid UUID",
        statusCode: 400
      });
    }

    // Security check: ensure JWT user matches URL parameter (unless admin)
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin' && jwtUserId !== urlUserId) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only access your own wishlist",
        statusCode: 403
      });
    }

    const items = await Wishlist.findAll({
      where: { userId: urlUserId },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: "Wishlist retrieved successfully",
      count: items.length,
      items
    });

  } catch (error: any) {
    console.error("getWishlist error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to retrieve wishlist",
      statusCode: 500
    });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.body;

    // Enhanced validation
    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User must be authenticated to access wishlist",
        statusCode: 401
      });
    }

    if (!productId) {
      return res.status(400).json({
        error: "Validation failed",
        message: "productId is required",
        statusCode: 400
      });
    }

    // Validate UUID format
    if (!validateUuid(productId)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "productId must be a valid UUID",
        statusCode: 400
      });
    }

    const deletedCount = await Wishlist.destroy({
      where: { userId, productId }
    });

    if (!deletedCount) {
      return res.status(404).json({
        error: "Not found",
        message: "Product not found in wishlist",
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully"
    });

  } catch (error: any) {
    console.error("removeFromWishlist error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to remove product from wishlist",
      statusCode: 500
    });
  }
};

export default { addToWishlist, getWishlist, removeFromWishlist };
