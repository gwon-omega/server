import { Request, Response } from "express";
import sequelize from "../database/connection";
import Cart from "../database/models/cartModel";
import Product from "../database/models/productModel";
import Order from "../database/models/orderModel";
import { Op } from "sequelize";

// Helper to compute discounted price
const computeItemPrice = (product: any) => {
  const base = Number(product.productPrice) || 0;
  let discount = Number(product.productDiscount) || 0; // percentage
  if (discount < 0) discount = 0; if (discount > 100) discount = 100; // clamp
  const price = base - (base * discount) / 100;
  return parseFloat(price.toFixed(2));
};

export const checkout = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.userId || user?.id; // support different token payload styles
  if (!userId) return res.status(400).json({ message: "missing user context" });

  const { initiatePayment } = req.query; // optional ?initiatePayment=true

  // Extract optional structured payload (tolerant: ignore if absent)
  const rawCustomer = (req.body && (req.body as any).customer) || undefined;
  const rawPayment = (req.body && (req.body as any).payment) || undefined;
  const rawNotes = (req.body && (req.body as any).notes) || undefined;

  const t = await sequelize.transaction();
  try {
    const cart = await Cart.findOne({ where: { userId }, transaction: t, lock: t.LOCK.UPDATE });
  const c: any = cart as any;
  if (!c || !Array.isArray(c.items) || c.items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "cart empty" });
    }

    // Load all products present in cart
  const productIds = c.items.map((i: any) => i.productId);
  const products = await Product.findAll({ where: { productId: { [Op.in]: productIds } }, transaction: t, lock: t.LOCK.UPDATE });
    const productMap = new Map(products.map((p: any) => [p.productId, p]));

    // Validate inventory & build order items
    const orderItems: any[] = [];
    let total = 0;
  for (const line of c.items) {
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

    // Sanitize customer & payment snapshots
    const customerData = rawCustomer ? {
      fullName: rawCustomer.fullName?.toString().slice(0,150) || null,
      email: rawCustomer.email?.toString().slice(0,180) || null,
      phone: rawCustomer.phone?.toString().slice(0,40) || null,
      address: rawCustomer.address?.toString().slice(0,500) || null,
      mapAddress: rawCustomer.mapAddress?.toString().slice(0,500) || null,
    } : null;

    let paymentMethod: string | null = null;
    let paymentData: any = null;
    if (rawPayment && rawPayment.method) {
      paymentMethod = String(rawPayment.method);
      if (paymentMethod === 'card' && rawPayment.card) {
        const num = (rawPayment.card.cardNumber || '').replace(/[^0-9]/g,'');
        const last4 = num ? num.slice(-4) : undefined;
        paymentData = {
          method: 'card',
          brand: undefined, // future: detect from BIN
          last4,
          expiry: rawPayment.card.expiry?.toString().slice(0,7) || null,
          nameOnCard: rawPayment.card.nameOnCard?.toString().slice(0,120) || null,
        };
      } else if (paymentMethod === 'wallet' && rawPayment.wallet) {
        paymentData = {
          method: 'wallet',
            provider: rawPayment.wallet.provider,
            walletNumber: rawPayment.wallet.walletNumber?.toString().slice(-4) || null, // store last 4 for reference only
        };
      } else if (paymentMethod === 'cod') {
        paymentData = { method: 'cod' };
      }
    }

    const notes = rawNotes ? String(rawNotes).slice(0, 2000) : null;

    // Create order with extended fields
    const order = await Order.create({
      userId,
      items: orderItems,
      total,
      totalAmount: total,
      status: 'pending',
      customerData,
      paymentData,
      paymentMethod,
      notes,
      paymentStatus: paymentMethod && paymentMethod !== 'cod' ? 'initiated' : 'pending',
      transactionRef: null,
    }, { transaction: t });

    // Clear cart
  c.items = [];
  c.total = 0;
  await c.save({ transaction: t });

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
