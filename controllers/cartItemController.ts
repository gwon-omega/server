import { Request, Response } from "express";
import { Op } from "sequelize";
import Cart from "../database/models/cartModel";
import CartItem from "../database/models/cartItemModel";
import Product from "../database/models/productModel";

// ------------------------------
// Helper: compute item price with discount
// ------------------------------
const computeItemPrice = (product: any) => {
  const base = Number(product.productPrice) || 0;
  let discount = Number(product.productDiscount) || 0; // percentage
  discount = Math.min(Math.max(discount, 0), 100);
  const price = base - (base * discount) / 100;
  return isNaN(price) ? 0 : parseFloat(price.toFixed(2));
};

// ------------------------------
// GET Cart
// ------------------------------
export const getCart = async (req: Request, res: Response) => {
  try {
    const tokenUserId = (req as any).user?.userId || (req as any).user?.id;
    const routeUserId = req.params.userId || req.query.userId || req.body.userId;
    const userId = tokenUserId || routeUserId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (tokenUserId && routeUserId && String(tokenUserId) !== String(routeUserId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let cart = await Cart.findOne({
      where: { userId },
      include: [{ model: CartItem, as: "items" }],
    });

    if (!cart) {
      return res.json({
        items: [],
        subtotal: 0,
        taxRate: 0.13,
        tax: 0,
        shipping: 0,
        discount: null,
        total: 0,
      });
    }

    const items = cart.items || [];
    const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    const taxRate = cart.taxRate ?? 0.13;
    const shipping = cart.shipping ?? 0;
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + tax + shipping).toFixed(2));

    return res.json({
      items,
      subtotal,
      taxRate,
      tax,
      shipping,
      total,
    });
  } catch (error) {
    console.error("getCart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// ADD Item to Cart
// ------------------------------
export const addItem = async (req: Request, res: Response) => {
  try {
    const tokenUserId = (req as any).user?.userId || (req as any).user?.id;
    const { userId: bodyUserId, productId, quantity = 1 } = req.body;
    const userId = tokenUserId || bodyUserId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (tokenUserId && bodyUserId && String(tokenUserId) !== String(bodyUserId)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!productId) return res.status(400).json({ message: "productId required" });

    // Find or create cart
    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const price = computeItemPrice(product);

    // Find existing item
    let item = await CartItem.findOne({ where: { cartId: cart.cartId, productId } });

    if (item) {
      item.quantity += quantity;
      item.price = price;
      await item.save();
    } else {
      item = await CartItem.create({
        cartId: cart.cartId,
        productId,
        quantity,
        price,
      });
    }

    return getCart(req, res); // return updated cart
  } catch (error) {
    console.error("addItem error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// UPDATE Item Quantity
// ------------------------------
export const updateItem = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, userId: bodyUserId } = req.body;
    const tokenUserId = (req as any).user?.userId || (req as any).user?.id;
    const userId = tokenUserId || bodyUserId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!productId) return res.status(400).json({ message: "productId required" });

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = await CartItem.findOne({ where: { cartId: cart.cartId, productId } });
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (quantity <= 0) {
      await item.destroy();
    } else {
      const product = await Product.findByPk(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      item.quantity = quantity;
      item.price = computeItemPrice(product);
      await item.save();
    }

    return getCart(req, res);
  } catch (error) {
    console.error("updateItem error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// REMOVE Item
// ------------------------------
export const removeItem = async (req: Request, res: Response) => {
  try {
    const { productId, userId: bodyUserId } = req.body;
    const tokenUserId = (req as any).user?.userId || (req as any).user?.id;
    const userId = tokenUserId || bodyUserId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!productId) return res.status(400).json({ message: "productId required" });

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    await CartItem.destroy({ where: { cartId: cart.cartId, productId } });

    return getCart(req, res);
  } catch (error) {
    console.error("removeItem error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// CLEAR Cart
// ------------------------------
export const clearCart = async (req: Request, res: Response) => {
  try {
    const tokenUserId = (req as any).user?.userId || (req as any).user?.id;
    const routeUserId = req.params.userId || req.body.userId;
    const userId = tokenUserId || routeUserId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    await CartItem.destroy({ where: { cartId: cart.cartId } });

    return res.json({
      items: [],
      subtotal: 0,
      taxRate: cart.taxRate ?? 0.13,
      tax: 0,
      shipping: cart.shipping ?? 0,
      total: 0,
    });
  } catch (error) {
    console.error("clearCart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default { getCart, addItem, updateItem, removeItem, clearCart };
