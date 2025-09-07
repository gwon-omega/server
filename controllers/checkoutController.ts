import { Request, Response } from "express";
import sequelize from "../database/connection";
import Cart from "../database/models/cartModel";
import Product from "../database/models/productModel";
import Order from "../database/models/orderModel";
import { Op } from "sequelize";

// Helper to compute discounted price
const computeItemPrice = (product: any) => {
  const base = product.productPrice || 0;
  const discount = product.productDiscount || 0; // percentage (0-100)
  const price = base - (base * discount) / 100;
  return parseFloat(price.toFixed(2));
};

export const checkout = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.userId || user?.id; // support different token payload styles
  if (!userId) return res.status(400).json({ message: "missing user context" });

  const { initiatePayment } = req.query; // optional ?initiatePayment=true to integrate with payment flow later

  const t = await sequelize.transaction();
  try {
    const cart = await Cart.findOne({ where: { userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "cart empty" });
    }

    // Load all products present in cart
    const productIds = cart.items.map((i: any) => i.productId);
  const products = await Product.findAll({ where: { productId: { [Op.in]: productIds } }, transaction: t, lock: t.LOCK.UPDATE });
    const productMap = new Map(products.map((p: any) => [p.productId, p]));

    // Validate inventory & build order items
    const orderItems: any[] = [];
    let total = 0;
    for (const line of cart.items) {
      const product = productMap.get(line.productId);
      if (!product) {
        await t.rollback();
        return res.status(400).json({ message: `product not found: ${line.productId}` });
      }
      if (product.productQuantity < line.quantity) {
        await t.rollback();
        return res.status(400).json({ message: `insufficient stock for product ${product.productName}` });
      }
      const unitPrice = computeItemPrice(product);
      const lineTotal = unitPrice * line.quantity;
      total += lineTotal;
      orderItems.push({
        productId: product.productId,
        productName: product.productName,
        quantity: line.quantity,
        unitPrice,
        lineTotal: parseFloat(lineTotal.toFixed(2)),
      });
      // decrement inventory & increment sold count
      product.productQuantity -= line.quantity;
      product.soldQuantity = (product.soldQuantity || 0) + line.quantity;
      await product.save({ transaction: t });
    }
    total = parseFloat(total.toFixed(2));

    // Create order
    const order = await Order.create(
      {
        userId,
        items: orderItems,
        total,
        totalAmount: total,
        status: "pending",
      },
      { transaction: t }
    );

    // Clear cart
    cart.items = [];
    cart.total = 0;
    await cart.save({ transaction: t });

    await t.commit();

    // Placeholder for payment initiation integration
    if (initiatePayment === "true") {
      // We could call payment service here and return payment gateway payload
      // For now respond with order object only
    }

    return res.status(201).json({ message: "checkout successful", order });
  } catch (err: any) {
    await t.rollback();
    console.error("Checkout failed", err);
    return res.status(500).json({ message: "checkout failed", error: err.message });
  }
};

export default { checkout };
