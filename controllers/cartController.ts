import { Request, Response } from "express";
import { Op } from "sequelize";
import Cart from "../database/models/cartModel";
import CartItem from "../database/models/cartItemModel";
import Product from "../database/models/productModel";
import CartService, { getVal, computeItemPrice } from "../services/cartService";

// ------------------------------
// Helper: get user ID from request (token or route/body params)
// ------------------------------
const getUserId = (req: Request) => {
  const tokenUserId = (req as any).user?.userId || (req as any).user?.id;
  const routeUserId = req.params?.userId || req.query?.userId || req.body?.userId;
  return { tokenUserId, routeUserId, userId: tokenUserId || routeUserId };
};

// ------------------------------
// Helper: validate user authorization
// ------------------------------
const validateUserAuth = (tokenUserId: string, routeUserId: string, res: Response) => {
  const userId = tokenUserId || routeUserId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  if (tokenUserId && routeUserId && String(tokenUserId) !== String(routeUserId)) {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }
  return userId;
};

// ------------------------------
// GET Cart - fetch cart with all items (with hybrid support)
// ------------------------------
export const getCart = async (req: Request, res: Response) => {
  try {
    const { tokenUserId, routeUserId } = getUserId(req);
    const userId = validateUserAuth(tokenUserId, routeUserId, res);
    if (!userId) return;

    const cart = await CartService.getCart(userId);
    return res.json(cart);
  } catch (error) {
    console.error("getCart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// ADD Item to Cart (with hybrid optimistic processing)
// ------------------------------
export const addItem = async (req: Request, res: Response) => {
  try {
    const { tokenUserId } = getUserId(req);
    const { userId: bodyUserId, productId, optimistic = true } = req.body;
    let { quantity = 1 } = req.body;

    // Validate and normalize quantity
    quantity = Math.max(1, parseInt(String(quantity), 10) || 1);
    quantity = Math.min(quantity, 99); // Cap at 99

    const userId = validateUserAuth(tokenUserId, bodyUserId, res);
    if (!userId) return;

    if (!productId) {
      return res.status(400).json({ message: "productId required" });
    }

    console.log('AddItem request (hybrid):', { userId, productId, quantity, optimistic });

    const cart = await CartService.addItem(userId, productId, quantity, optimistic);
    return res.json(cart);
  } catch (error) {
    console.error("addItem error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// UPDATE Item quantity (with hybrid optimistic processing)
// ------------------------------
export const updateItem = async (req: Request, res: Response) => {
  try {
    const { tokenUserId } = getUserId(req);
    const { userId: bodyUserId, productId, quantity, optimistic = true } = req.body;

    const userId = validateUserAuth(tokenUserId, bodyUserId, res);
    if (!userId) return;

    if (!productId) {
      return res.status(400).json({ message: "productId required" });
    }

    console.log('UpdateItem request (hybrid):', { userId, productId, quantity, optimistic });

    const cart = await CartService.updateItem(userId, productId, quantity, optimistic);
    return res.json(cart);
  } catch (error) {
    console.error("updateItem error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// REMOVE Item from Cart (with hybrid optimistic processing)
// ------------------------------
export const removeItem = async (req: Request, res: Response) => {
  try {
    const { tokenUserId } = getUserId(req);
    const { userId: bodyUserId, productId, optimistic = true } = req.body;

    const userId = validateUserAuth(tokenUserId, bodyUserId, res);
    if (!userId) return;

    if (!productId) {
      return res.status(400).json({ message: "productId required" });
    }

    console.log('RemoveItem request (hybrid):', { userId, productId, optimistic });

    const cart = await CartService.removeItem(userId, productId, optimistic);
    return res.json(cart);
  } catch (error) {
    console.error("removeItem error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// CLEAR Cart - remove all items (with hybrid optimistic processing)
// ------------------------------
export const clearCart = async (req: Request, res: Response) => {
  try {
    const { tokenUserId, routeUserId } = getUserId(req);
    const { optimistic = true } = req.body;
    const userId = validateUserAuth(tokenUserId, routeUserId, res);
    if (!userId) return;

    console.log('ClearCart request (hybrid):', { userId, optimistic });

    const cart = await CartService.clearCart(userId, optimistic);
    return res.json(cart);
  } catch (error) {
    console.error("clearCart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// SYNC Entire Cart (replace all items)
// ------------------------------
export const syncCart = async (req: Request, res: Response) => {
  try {
    const { tokenUserId } = getUserId(req);
    const { userId: bodyUserId, items } = req.body;

    const userId = validateUserAuth(tokenUserId, bodyUserId, res);
    if (!userId) return;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "items must be an array" });
    }

    console.log('SyncCart request:', { userId, itemCount: items.length });

    // Filter and normalize incoming items
    const normalized = items
      .filter((it: any) => it && it.productId && Number(it.quantity) > 0)
      .map((it: any) => ({
        productId: String(it.productId),
        quantity: Math.min(99, Math.max(1, parseInt(String(it.quantity), 10) || 1))
      }));

    // Dedupe by productId keeping last occurrence
    const map = new Map<string, { productId: string; quantity: number }>();
    for (const it of normalized) map.set(it.productId, it);
    const unique = Array.from(map.values());

    // Find or create cart
    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Clear existing items
    await CartItem.destroy({ where: { cartId: cart.cartId } });

    if (unique.length === 0) {
      // Empty sync - cart is already cleared
      console.log('Sync with empty items - cart cleared');
      return res.json({
        cartId: cart.cartId,
        userId,
        items: [],
        subtotal: 0,
        taxRate: cart.taxRate ?? 0.13,
        tax: 0,
        shipping: cart.shipping ?? 0,
        discount: null,
        total: 0,
      });
    }

    // Load products to compute prices
    const productIds = unique.map(u => u.productId);
    const products = await Product.findAll({
      where: { productId: { [Op.in]: productIds } }
    });

    const productMap = new Map(products.map((p: any) => [String(getVal(p, 'productId')), p]));

    // Create new cart items
    const cartItemsData = unique
      .map(u => {
        const product = productMap.get(u.productId);
        if (!product) {
          console.warn('Product not found during sync, skipping:', u.productId);
          return null;
        }
        return {
          cartId: cart.cartId,
          productId: u.productId,
          quantity: u.quantity,
          price: computeItemPrice(product)
        };
      })
      .filter(Boolean);

    if (cartItemsData.length > 0) {
      await CartItem.bulkCreate(cartItemsData as any[]);
    }

    console.log('Cart synced successfully with', cartItemsData.length, 'items');

    // Return updated cart
    return getCart(req, res);
  } catch (error) {
    console.error('syncCart error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export default { getCart, addItem, updateItem, removeItem, clearCart, syncCart };
