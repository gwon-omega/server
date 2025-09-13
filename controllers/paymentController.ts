import { Request, Response } from "express";
import paymentService from "../services/paymentService";
import Payment from "../database/models/paymentModel";
import { updatePaymentStatus } from "../services/paymentService";

export const validateEsewa = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const result = await paymentService.validateEsewaPayment(payload);
    return res.json({ result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const initiateKhalti = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const result = await paymentService.initiateKhaltiPayment(payload);
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
    const userId = (req.query.userId as string) || undefined;
    // Simple fetch; optionally filter by metadata.userId to associate payments to a user
    const all = await (Payment as any).findAll();
    const rows = userId
      ? all.filter((p: any) => {
          const meta = p.get ? p.get("metadata") : p.metadata;
          return meta && (meta.userId === userId || meta.user_id === userId);
        })
      : all;
    // shape response minimally
    const payments = rows.map((p: any) => {
      const obj = p.toJSON ? p.toJSON() : p;
      return {
        paymentId: obj.paymentId,
        transaction_uuid: obj.transaction_uuid,
        platform: obj.platform,
        amount: obj.amount,
        status: obj.status,
        ref_id: obj.ref_id,
        metadata: obj.metadata || null,
        createdAt: obj.createdAt,
      };
    });
    return res.json({ payments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export default { validateEsewa, initiateKhalti };
