import { Request, Response } from "express";
import paymentService from "../services/paymentService";
import Payment from "../database/models/paymentModel";
import { updatePaymentStatus } from "../services/paymentService";

export const validateEsewa = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const auth = (req as any).user;
    const result = await paymentService.validateEsewaPayment(payload, auth?.id || auth?.userId);
    return res.json({ result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const initiateKhalti = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const auth = (req as any).user;
    const result = await paymentService.initiateKhaltiPayment(payload, undefined, auth?.id || auth?.userId);
    return res.json({ result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const esewaWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    // expected: transaction_uuid, status, ref_id
    const tx = payload.transaction_uuid || payload.transactionId || payload.transaction_id;
    const status = payload.status || payload.txStatus || payload.response_status || "UNKNOWN";
    const ref_id = payload.ref_id || payload.refId || null;
    await updatePaymentStatus(tx, status, ref_id, payload);
    return res.json({ message: "received" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const khaltiWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    // khalti will send status fields; normalize them
    const tx = payload.purchase_order_id || payload.transaction_uuid || payload.purchase_order_id;
    const status = payload.status || "UNKNOWN";
    const ref_id = payload.ref_id || payload.reference || null;
    await updatePaymentStatus(tx, status, ref_id, payload);
    return res.json({ message: "received" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const listPayments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { userId } = req.query as { userId?: string };
    const where: any = {};

    // If a user is logged in and not admin, force filter by their id
    if (user && user.role !== "admin") {
      where.userId = user.id || user.userId;
    } else if (userId) {
      // Admin can filter by any userId if provided
      where.userId = userId;
    }

    const payments = await Payment.findAll({ where, order: [["createdAt", "DESC"]] });
    return res.json({ payments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export default { validateEsewa, initiateKhalti };
