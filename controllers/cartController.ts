import { Request, Response } from "express";
import Cart from "../database/models/cartModel";
import Product from "../database/models/productModel";

// ------------------------------
// Helper: compute discounted price per product
// ------------------------------
const computeItemPrice = (product: any) => {
  const base = Number(product.productPrice) || 0;
  let discount = Number(product.productDiscount) || 0; // percentage
  discount = Math.min(Math.max(discount, 0), 100); // clamp 0-100
  return parseFloat((base - (base * discount) / 100).toFixed(2));
};

// ------------------------------
// Helper: compute cart subtotal, tax, shipping, discounts, total
// ------------------------------
const calcSummary = (cart: any) => {
  const items = Array.isArray(cart.items) ? cart.items : [];
  const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);
  const taxRate = typeof cart.taxRate === "number" ? cart.taxRate : 0.18;
  const shipping = typeof cart.shipping === "number" ? cart.shipping : 0;

  let discountAmount = 0;
  const applied = cart.appliedDiscount;
  if (applied) {
    if (applied.type === "percent") discountAmount = (subtotal * applied.value) / 100;
    else discountAmount = applied.value;
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const taxable = Math.max(0, subtotal - discountAmount);
  const tax = parseFloat((taxable * taxRate).toFixed(2));
  const total = parseFloat((taxable + tax + shipping).toFixed(2));

  cart.total = total;

  return {
    subtotal,
    taxRate,
    tax,
    shipping,
    discount: applied
      ? { type: applied.type, value: applied.value, code: applied.code }
      : null,
    discountAmount,
    total,
  };
};

// ------------------------------
// GET Cart
// ------------------------------
export const getCart = async (req: Request, res: Response) => {
  try {
    const tokenUserId = (req as any).user?.id;
    const routeUserId = (req.params as any)?.userId || (req.query as any)?.userId || (req.body as any)?.userId;
    const userId = tokenUserId || routeUserId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (tokenUserId && routeUserId && String(tokenUserId) !== String(routeUserId)) {
      return res.status(403).json({ message: "forbidden" });
    }

    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return res.json({
        items: [],
        subtotal: 0,
        taxRate: 0.18,
        tax: 0,
        shipping: 0,
        discount: null,
        total: 0,
      });
    }

    // Refresh item prices
    const items = Array.isArray(cart.items) ? cart.items : [];
    if (items.length > 0) {
  const productIds = items.map((i: any) => i.productId);
  const { Op } = require('sequelize');
  const products = await Product.findAll({ where: { productId: { [Op.in]: productIds } } as any });
  const productMap = new Map(products.map((p: any) => [String(p.productId), p]));

      const updatedItems = items
        .map((item: any) => {
          const product = productMap.get(String(item.productId));
          if (product) {
            return { ...item, price: computeItemPrice(product) };
          }
          return null; // remove deleted product
        })
        .filter(Boolean);

      cart.items = updatedItems;
      calcSummary(cart);
      await cart.save();
    }

    const summary = calcSummary(cart);
    return res.json({ items: cart.items, ...summary });
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
    const tokenUserId = (req as any).user?.id;
    const { userId: bodyUserId, productId, quantity = 1 } = req.body;
    const userId = tokenUserId || bodyUserId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (tokenUserId && bodyUserId && String(tokenUserId) !== String(bodyUserId)) {
      return res.status(403).json({ message: "forbidden" });
    }
    if (!productId) return res.status(400).json({ message: "productId required" });

  const product = await (Product as any).findByPk(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const price = computeItemPrice(product);

    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId, items: [{ productId, quantity, price }] });
    } else {
      const items = Array.isArray(cart.items) ? cart.items : [];
      const idx = items.findIndex((i: any) => String(i.productId) === String(productId));
      if (idx >= 0) {
        items[idx].quantity += quantity;
      } else {
        items.push({ productId, quantity, price });
      }
      cart.items = items;
    }

    const summary = calcSummary(cart);
    await cart.save();
    return res.status(200).json({ items: cart.items, ...summary });
  } catch (error) {
    console.error("addItem error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// UPDATE Item quantity
// ------------------------------
export const updateItem = async (req: Request, res: Response) => {
  try {
    const tokenUserId = (req as any).user?.id;
    const { userId: bodyUserId, productId, quantity } = req.body;
    const userId = tokenUserId || bodyUserId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (tokenUserId && bodyUserId && String(tokenUserId) !== String(bodyUserId)) {
      return res.status(403).json({ message: "forbidden" });
    }
    if (!productId) return res.status(400).json({ message: "productId required" });

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const items = Array.isArray(cart.items) ? cart.items : [];
    const idx = items.findIndex((i: any) => String(i.productId) === String(productId));
    if (idx === -1) return res.status(404).json({ message: "Item not found" });

    if (quantity <= 0) {
      items.splice(idx, 1);
    } else {
  const product = await (Product as any).findByPk(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });

      items[idx].quantity = quantity;
      items[idx].price = computeItemPrice(product);
    }

    cart.items = items;
    const summary = calcSummary(cart);
    await cart.save();
    return res.json({ items: cart.items, ...summary });
  } catch (error) {
    console.error("updateItem error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// CLEAR Cart
// ------------------------------
export const clearCart = async (req: Request, res: Response) => {
  try {
    const tokenUserId = (req as any).user?.id;
    const routeUserId = (req.params as any)?.userId || (req.body as any)?.userId;
    const userId = tokenUserId || routeUserId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (tokenUserId && routeUserId && String(tokenUserId) !== String(routeUserId)) {
      return res.status(403).json({ message: "forbidden" });
    }

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    cart.appliedDiscount = null;
    cart.total = 0;
    await cart.save();

    return res.json({
      items: [],
      subtotal: 0,
      taxRate: cart.taxRate ?? 0.18,
      tax: 0,
      shipping: cart.shipping ?? 0,
      discount: null,
      total: 0,
    });
  } catch (error) {
    console.error("clearCart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default { getCart, addItem, updateItem, clearCart };
