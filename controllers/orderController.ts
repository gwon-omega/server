import { Request, Response } from "express";
import Order from "../database/models/orderModel";

// Utility: produce a plain object copy of an order with conditional redaction.
function sanitizeOrder(orderInstance: any, user: any) {
  const isAdmin = user?.role === "admin";
  const plain = orderInstance.get ? orderInstance.get({ plain: true }) : { ...orderInstance };

  if (!isAdmin) {
    // Always hide raw paymentData details from non-admin users.
    if (plain.paymentData) {
      const pd = plain.paymentData || {};
      plain.paymentData = {
        last4: pd.last4 ?? undefined,
        brand: pd.brand ?? pd.cardBrand ?? undefined,
        expMonth: pd.expMonth ?? undefined,
        expYear: pd.expYear ?? undefined,
        method: pd.method ?? plain.paymentMethod ?? undefined,
        masked: true,
      };
    }
  }
  return plain;
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.userId || !Array.isArray(payload.items))
      return res.status(400).json({ message: "userId and items required" });

    const total = (payload.items || []).reduce((s: number, it: any) => s + (it.price || 0) * (it.quantity || 0), 0);
    const order = await Order.create({ userId: payload.userId, items: payload.items, total });
    return res.status(201).json({ message: "created", order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const isAdmin = authUser?.role === "admin";
    const where: any = {};

    if (req.query.userId) {
      where.userId = req.query.userId;
    }

    // Non-admins: force scoping to their own userId regardless of query to prevent enumerating others' orders.
    if (!isAdmin) {
      where.userId = authUser?.userId;
    }

    const orders = await Order.findAll({ where, order: [["createdAt", "DESC"]] });
    const sanitized = orders.map(o => sanitizeOrder(o, authUser));
    return res.json({ orders: sanitized });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const isAdmin = authUser?.role === "admin";
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "not found" });
    // Ownership enforcement for non-admin
    if (!isAdmin && (order as any).userId !== authUser?.userId) {
      return res.status(403).json({ message: "forbidden" });
    }
    return res.json({ order: sanitizeOrder(order, authUser) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const isAdmin = authUser?.role === "admin";

    // Disallow non-admin from altering sensitive payment lifecycle fields
    if (!isAdmin) {
      delete (req as any).body.paymentData;
      delete (req as any).body.paymentStatus;
      delete (req as any).body.transactionRef;
      delete (req as any).body.totalAmount; // prevent tampering
      delete (req as any).body.total; // prevent tampering
    }

    const [, [updated]] = await Order.update(req.body, { where: { orderId: req.params.id }, returning: true });
    if (!updated) return res.status(404).json({ message: "not found" });
    return res.json({ message: "updated", order: sanitizeOrder(updated, authUser) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const count = await Order.destroy({ where: { orderId: req.params.id } });
    if (!count) return res.status(404).json({ message: "not found" });
    return res.json({ message: "deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Download a simple transcript (text) for an order
export const downloadTranscript = async (req: Request, res: Response) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "not found" });

    const lines: string[] = [];
    lines.push(`Order ID: ${(order as any).orderId}`);
    lines.push(`User ID: ${(order as any).userId}`);
    lines.push(`Status: ${(order as any).status}`);
    lines.push(`Total: ${(order as any).total}`);
    lines.push("\nItems:");
    (order as any).items.forEach((it: any, idx: number) => {
      lines.push(`${idx + 1}. productId=${it.productId} quantity=${it.quantity} price=${it.price}`);
    });

    const content = lines.join("\n");
    res.setHeader("Content-Disposition", `attachment; filename=order-${(order as any).orderId}.txt`);
    res.setHeader("Content-Type", "text/plain");
    return res.send(content);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export default { createOrder, getOrders, getOrderById, updateOrder, deleteOrder, downloadTranscript };
