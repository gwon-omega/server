import { Request, Response } from "express";
import { Op } from "sequelize";
import Cart from "../database/models/cartModel";
import CartItem from "../database/models/cartItemModel";
import Coupon from "../database/models/couponModel";

// ------------------------------
// Helper: calculate cart totals from normalized cart structure
// ------------------------------
const calculateCartTotals = (items: any[], cart: any) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = typeof cart.taxRate === "number" ? cart.taxRate : 0.13;
  const shipping = typeof cart.shipping === "number" ? cart.shipping : 0;

  let discountAmount = 0;
  const applied = cart.appliedDiscount;
  if (applied) {
    if (applied.type === "percent") {
      discountAmount = (subtotal * applied.value) / 100;
    } else {
      discountAmount = applied.value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = parseFloat((taxableAmount * taxRate).toFixed(2));
  const total = parseFloat((taxableAmount + tax + shipping).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxRate,
    tax,
    shipping,
    discount: applied ? {
      type: applied.type,
      value: applied.value,
      code: applied.code
    } : null,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    total,
  };
};

export const applyGiftCode = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { code } = req.body || {};

    console.log('ApplyGiftCode request:', { userId, code });

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!code) {
      return res.status(400).json({ message: "Gift code required" });
    }

    // Find the coupon/gift code with comprehensive validation
    const coupon = await Coupon.findOne({
      where: {
        code: String(code).trim().toUpperCase(),
      }
    });

    if (!coupon) {
      return res.status(400).json({ message: "Invalid gift code" });
    }

    // Get coupon data as plain object
    const couponData = coupon.toJSON();
    console.log('Found coupon for gift code application:', couponData.code);

    const now = new Date();

    // Check if coupon is active
    if (couponData.status !== "active") {
      return res.status(400).json({ message: "This coupon is not active" });
    }

    // Check expiration and auto-deactivate if expired
    if (couponData.expiresAt && now > new Date(couponData.expiresAt)) {
      console.log('Gift code expired, deactivating:', couponData.code);
      await coupon.update({ status: "inactive" });
      return res.status(400).json({ message: "This coupon has expired" });
    }

    // Check if user has already used this coupon (one-time use per user)
    if (couponData.usersUsed && couponData.usersUsed.includes(userId)) {
      console.log('User already used this coupon:', { userId, code: couponData.code });
      return res.status(400).json({ message: "You have already used this code" });
    }

    // Check start date
    if (couponData.startsAt && now < new Date(couponData.startsAt)) {
      return res.status(400).json({ message: "This coupon is not yet valid" });
    }

    // Check usage limits
    if (couponData.maxUses !== null && couponData.maxUses !== undefined && couponData.usedCount >= couponData.maxUses) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    // Find or create cart
    let cart = await Cart.findOne({
      where: { userId },
      include: [{
        model: CartItem,
        as: "items"
      }]
    });

    if (!cart) {
      console.log('Creating new cart for user:', userId);
      cart = await Cart.create({ userId });
    }

    // Apply the discount to the cart
    cart.appliedDiscount = {
      id: String(couponData.couponId),
      code: couponData.code,
      type: couponData.discountType,
      value: Number(couponData.value),
    } as any;

    await cart.save();

    // Get cart items for total calculation
    const items = cart.items || [];
    const cartItems = items.map((item: any) => ({
      productId: String(item.productId),
      quantity: Number(item.quantity),
      price: Number(item.price)
    }));

    // Calculate totals with the applied discount
    const totals = calculateCartTotals(cartItems, cart);

    // Track user usage - add user to usersUsed array and increment usedCount
    const currentUsersUsed = couponData.usersUsed || [];
    const updatedUsersUsed = [...currentUsersUsed, userId];
    const newUsedCount = couponData.usedCount + 1;

    await coupon.update({
      usersUsed: updatedUsersUsed,
      usedCount: newUsedCount
    });

    console.log('Gift code applied successfully:', {
      code: couponData.code,
      discountType: couponData.discountType,
      value: couponData.value,
      newUsedCount,
      userId
    });

    return res.json({
      cartId: cart.cartId,
      userId,
      items: cartItems,
      ...totals
    });

  } catch (err) {
    console.error("applyGiftCode error:", err);
    return res.status(500).json({ message: "Failed to apply gift code" });
  }
};

export const removeGiftCode = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;

    console.log('RemoveGiftCode request for user:', userId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find cart with items
    const cart = await Cart.findOne({
      where: { userId },
      include: [{
        model: CartItem,
        as: "items"
      }]
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove the applied discount
    cart.appliedDiscount = null;
    await cart.save();

    // Get cart items for total calculation
    const items = cart.items || [];
    const cartItems = items.map((item: any) => ({
      productId: String(item.productId),
      quantity: Number(item.quantity),
      price: Number(item.price)
    }));

    // Recalculate totals without discount
    const totals = calculateCartTotals(cartItems, cart);

    console.log('Gift code removed successfully');

    return res.json({
      cartId: cart.cartId,
      userId,
      items: cartItems,
      ...totals
    });

  } catch (err) {
    console.error("removeGiftCode error:", err);
    return res.status(500).json({ message: "Failed to remove gift code" });
  }
};

export default { applyGiftCode, removeGiftCode };
