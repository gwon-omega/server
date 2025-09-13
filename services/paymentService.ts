import axios from "axios";
import Payment from "../database/models/paymentModel";

const ESEWA_VALIDATE_URL = process.env.ESEWA_VALIDATE_URL || "https://uat.esewa.com.np/epay/transrec";
const KHALTI_INIT_URL = process.env.KHALTI_INIT_URL || "https://dev.khalti.com/api/v2/epayment/initiate/";

export const validateEsewaPayment = async (payload: any, userId?: string) => {
  // payload should contain transaction_uuid and product_code and total_amount
  // eSewa provides different endpoints; here we call a hypothetical validate endpoint
  try {
    // Persist a PENDING attempt first
    await Payment.create({
      transaction_uuid: payload.transaction_uuid || payload.transactionId || "",
      platform: "esewa",
      amount: parseFloat(payload.total_amount || payload.amount || 0),
      status: "PENDING",
      userId: userId || payload.userId || null,
      metadata: payload,
    });

    const resp = await axios.post(ESEWA_VALIDATE_URL, payload, { timeout: 10000 });

    // Update payment record based on response if possible
    const r = resp.data;
    if (r && (r.status || r.code)) {
      await Payment.update(
        { status: r.status || (r.code === 0 ? "ERROR" : "UNKNOWN"), ref_id: r.ref_id ?? null, metadata: r },
        { where: { transaction_uuid: payload.transaction_uuid || payload.transactionId } }
      );
    }

    return resp.data;
  } catch (err: any) {
    return { code: 0, error_message: err.message || "Service is currently unavailable" };
  }
};

export const initiateKhaltiPayment = async (payload: any, secretKey?: string, userId?: string) => {
  try {
    // Persist a Khalti INITIATED payment record
    await Payment.create({
      transaction_uuid: payload.purchase_order_id || payload.transaction_uuid || payload.purchase_order_id,
      platform: "khalti",
      amount: parseFloat(payload.amount || 0),
      status: "INITIATED",
      userId: userId || payload.userId || null,
      metadata: payload,
    });

    const resp = await axios.post(KHALTI_INIT_URL, payload, {
      headers: {
        Authorization: `Key ${secretKey || process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    // update with response (if any status)
    const r = resp.data;
    if (r) {
      await Payment.update({ metadata: r }, { where: { transaction_uuid: payload.purchase_order_id || payload.transaction_uuid } });
    }
    return resp.data;
  } catch (err: any) {
    return { code: 0, error_message: err.message || "Service is currently unavailable" };
  }
};

export const updatePaymentStatus = async (transaction_uuid: string, status: string, ref_id?: string, metadata?: any) => {
  const [count, rows] = await Payment.update({ status, ref_id: ref_id ?? null, metadata }, { where: { transaction_uuid }, returning: true });
  return { count, rows };
};

export default { validateEsewaPayment, initiateKhaltiPayment };
