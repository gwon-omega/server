import { Request, Response } from "express";
import Cart from "../database/models/cartModel";
import Product from "../database/models/productModel";

// ------------------------------
// Helper: compute discounted price per product
// ------------------------------
const getVal = (obj: any, key: string) => (obj && typeof obj.get === "function") ? obj.get(key) : obj?.[key];

const computeItemPrice = (product: any) => {
  const base = Number(getVal(product, "productPrice")) || 0;
  let discount = Number(getVal(product, "productDiscount")) || 0; // percentage
  discount = Math.min(Math.max(discount, 0), 100); // clamp 0-100
  const price = base - (base * discount) / 100;
  return isNaN(price) ? 0 : parseFloat(price.toFixed(2));
};

// ------------------------------
// Helper: compute cart subtotal, tax, shipping, discounts, total
// ------------------------------
const calcSummary = (cart: any) => {
  const items = Array.isArray((cart as any).items) ? (cart as any).items : [];
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
  const tokenUserId = (req as any).user?.userId || (req as any).user?.id;
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
      console.log('getCart: refreshing item prices for productIds:', productIds);
      const products = await Product.findAll({ where: { productId: { [Op.in]: productIds } } as any });
      console.log('getCart: found products:', products?.length || 0);
      const productMap = new Map(products.map((p: any) => [String(getVal(p, 'productId')), p]));

      const updatedItems = items.map((item: any) => {
        const product = productMap.get(String(item.productId));
        if (product) {
          return { ...item, price: computeItemPrice(product) };
        }
        // If product not found (e.g., temporarily missing or soft-deleted), retain the item with existing price/quantity
        console.warn('getCart: product not found for item, retaining as-is:', item.productId);
        return item;
      });

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
  const tokenUserId = (req as any).user?.userId || (req as any).user?.id;
    const { userId: bodyUserId, productId } = req.body;
    let { quantity = 1 } = req.body;
    quantity = Math.max(1, parseInt(String(quantity), 10) || 1);
    const userId = tokenUserId || bodyUserId;

    console.log('AddItem request:', { tokenUserId, bodyUserId, productId, quantity, userId });

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (tokenUserId && bodyUserId && String(tokenUserId) !== String(bodyUserId)) {
      return res.status(403).json({ message: "forbidden" });
    }
    if (!productId) return res.status(400).json({ message: "productId required" });

    const product = await (Product as any).findByPk(productId);
    const productName = product ? (getVal(product, 'productName') ?? '(no name)') : undefined;
    console.log('Product found:', product ? productName : 'Not found');
    if (!product) return res.status(404).json({ message: "Product not found" });

    const price = computeItemPrice(product);
    console.log('Computed price:', price);

    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      console.log('Creating new cart for user:', userId);
      cart = await Cart.create({ userId, items: [{ productId, quantity, price }] });
    } else {
      console.log('Updating existing cart, current items:', (cart as any).items);
      const items = Array.isArray((cart as any).items) ? (cart as any).items : [];
      const idx = items.findIndex((i: any) => String(i.productId) === String(productId));
      if (idx >= 0) {
        console.log('Updating existing item quantity from', items[idx].quantity, 'to', items[idx].quantity + quantity);
        items[idx].quantity += quantity;
      } else {
        console.log('Adding new item to cart');
        items.push({ productId, quantity, price });
      }
      (cart as any).items = items;
    }

    const summary = calcSummary(cart as any);
    await cart.save();
    console.log('Cart saved with summary:', summary);
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
  const tokenUserId = (req as any).user?.userId || (req as any).user?.id;
    const { userId: bodyUserId, productId, quantity } = req.body;
    const userId = tokenUserId || bodyUserId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (tokenUserId && bodyUserId && String(tokenUserId) !== String(bodyUserId)) {
      return res.status(403).json({ message: "forbidden" });
    }
    if (!productId) return res.status(400).json({ message: "productId required" });

  const cart = await Cart.findOne({ where: { userId } });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

  const items = Array.isArray((cart as any).items) ? (cart as any).items : [];
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

  (cart as any).items = items;
  const summary = calcSummary(cart as any);
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
  const tokenUserId = (req as any).user?.userId || (req as any).user?.id;
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
