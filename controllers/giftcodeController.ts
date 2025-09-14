import { Request, Response } from "express";
import { Op } from "sequelize";
import Cart from "../database/models/cartModel";
import Coupon from "../database/models/couponModel";

// Calculate and return full summary for the cart
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
    if (discountAmount > subtotal) discountAmount = subtotal;
  }

  const taxable = Math.max(0, subtotal - discountAmount);
  const tax = +((taxable * taxRate).toFixed(2));
  const total = +((taxable + tax + shipping).toFixed(2));
  cart.total = total;
  return {
    subtotal,
    taxRate,
    tax,
    shipping,
    discount: applied ? { type: applied.type, value: applied.value, code: applied.code } : null,
    discountAmount,
    total,
  };
};

export const applyGiftCode = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { code } = req.body || {};
    if (!userId) return res.status(401).json({ message: "unauthorized" });
    if (!code) return res.status(400).json({ message: "code required" });

    const coupon = await Coupon.findOne({
      where: {
        code: String(code).trim().toUpperCase(),
        status: "active",
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gte]: new Date() } }],
      } as any,
    });
    if (!coupon) return res.status(400).json({ message: "invalid" });

    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) cart = await Cart.create({ userId, items: [], total: 0 });

    cart.appliedDiscount = {
      id: String((coupon as any).couponId || (coupon as any).id),
      code: (coupon as any).code,
      type: (coupon as any).discountType,
      value: Number((coupon as any).value),
    } as any;

    const summary = calcSummary(cart);
    await cart.save();
    return res.json({ ok: true, items: cart.items, ...summary });
  } catch (err) {
    console.error("applyGiftCode error", err);
    return res.status(500).json({ message: "failed" });
  }
};

export const removeGiftCode = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "unauthorized" });
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) return res.status(404).json({ message: "cart not found" });
    cart.appliedDiscount = null;
    const summary = calcSummary(cart);
    await cart.save();
    return res.json({ ok: true, items: cart.items, ...summary });
  } catch (err) {
    console.error("removeGiftCode error", err);
    return res.status(500).json({ message: "failed" });
  }
};

export default { applyGiftCode, removeGiftCode };
