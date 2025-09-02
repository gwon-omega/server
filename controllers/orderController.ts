import { Request, Response } from "express";
import Order from "../database/models/orderModel";

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
    const where: any = {};
    if (req.query.userId) where.userId = req.query.userId;
    const orders = await Order.findAll({ where });
    return res.json({ orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "not found" });
    return res.json({ order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const [, [updated]] = await Order.update(req.body, { where: { orderId: req.params.id }, returning: true });
    if (!updated) return res.status(404).json({ message: "not found" });
    return res.json({ message: "updated", order: updated });
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
