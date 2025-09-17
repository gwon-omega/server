import { Request, Response } from "express";
import { Op } from "sequelize";
import Coupon from "../database/models/couponModel";

// Basic input sanitization & validation
const parseNumber = (v: any): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
};

const buildCouponPayload = (body: any, isCreate = true) => {
  const {
    code,
    discountType,
    value,
    maxUses,
    startsAt,
    expiresAt,
    status,
    minOrderAmount,
    metadata,
    imageUrl,
  } = body;

  const payload: any = {};
  if (code !== undefined) payload.code = String(code).trim().toUpperCase();
  if (discountType !== undefined) payload.discountType = discountType;
  if (value !== undefined) payload.value = parseNumber(value);
  if (maxUses !== undefined) payload.maxUses = maxUses === null ? null : parseNumber(maxUses);
  if (startsAt !== undefined) payload.startsAt = startsAt ? new Date(startsAt) : null;
  if (expiresAt !== undefined) payload.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (status !== undefined) payload.status = status;
  if (minOrderAmount !== undefined) payload.minOrderAmount = minOrderAmount === null ? null : parseNumber(minOrderAmount);
  if (metadata !== undefined) payload.metadata = metadata;
  if (imageUrl !== undefined) payload.imageUrl = imageUrl === null ? null : String(imageUrl).trim();

  if (isCreate) {
    if (!payload.code) throw new Error("code required");
    if (!payload.discountType) throw new Error("discountType required");
    if (payload.value === undefined) throw new Error("value required");
  }

  if (payload.discountType && !["percent", "fixed"].includes(payload.discountType)) {
    throw new Error("invalid discountType");
  }
  if (payload.discountType === "percent" && (payload.value < 0 || payload.value > 100)) {
    throw new Error("percent value must be between 0 and 100");
  }
  if (payload.discountType === "fixed" && payload.value <= 0) {
    throw new Error("fixed value must be > 0");
  }
  if (payload.startsAt && payload.expiresAt && payload.startsAt > payload.expiresAt) {
    throw new Error("startsAt cannot be after expiresAt");
  }
  return payload;
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const payload = buildCouponPayload(req.body, true);
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file) {
      const anyFile: any = file;
      payload.imageUrl = anyFile.secure_url || anyFile.path || anyFile.location || anyFile.url || anyFile.filename;
    }
    // Upsert-by-code: if a coupon with the same code exists, update it instead of failing
    const exists = await Coupon.findOne({ where: { code: payload.code } });
    if (exists) {
      await (exists as any).update(payload);
      return res.status(200).json({ ...exists.toJSON(), _updated: true });
    }
    const coupon = await Coupon.create(payload);
    return res.status(201).json({ ...coupon.toJSON(), _created: true });
  } catch (err: any) {
    return res.status(400).json({ message: err.message || "failed" });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const { q, status } = req.query as any;
    const where: any = {};
    if (status) where.status = status;
    if (q) where.code = { [Op.iLike]: `%${String(q).trim().toUpperCase()}%` };
    const coupons = await Coupon.findAll({ where, order: [["createdAt", "DESC"]] });
    return res.json(coupons);
  } catch (err) {
    return res.status(500).json({ message: "failed" });
  }
};

export const getCouponById = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: "not found" });
    return res.json(coupon);
  } catch (err) {
    return res.status(500).json({ message: "failed" });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: "not found" });
    const payload = buildCouponPayload(req.body, false);
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file) {
      const anyFile: any = file;
      payload.imageUrl = anyFile.secure_url || anyFile.path || anyFile.location || anyFile.url || anyFile.filename;
    }
    // Prevent changing code to duplicate (exclude current coupon from check)
    if (payload.code && payload.code !== (coupon as any).code) {
      const dup = await Coupon.findOne({
        where: {
          code: payload.code,
          couponId: { [Op.ne]: req.params.id } // Exclude current coupon
        }
      });
      if (dup) return res.status(409).json({ message: "code already exists" });
    }
    await coupon.update(payload);
    return res.json(coupon);
  } catch (err: any) {
    return res.status(400).json({ message: err.message || "failed" });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: "not found" });
    await coupon.destroy();
    return res.json({ message: "deleted" });
  } catch (err) {
    return res.status(500).json({ message: "failed" });
  }
};

// Validate a coupon for a given order total
export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code, orderTotal } = req.body || {};
    if (!code) return res.status(400).json({ valid: false, message: "code required" });
    const total = Number(orderTotal);
    if (isNaN(total) || total < 0) return res.status(400).json({ valid: false, message: "invalid orderTotal" });
    const coupon = await Coupon.findOne({ where: { code: String(code).trim().toUpperCase() } });
    if (!coupon) return res.status(404).json({ valid: false, message: "not found" });

    const now = new Date();
    if ((coupon as any).status !== "active") return res.status(400).json({ valid: false, message: "inactive" });
    if ((coupon as any).startsAt && now < (coupon as any).startsAt) return res.status(400).json({ valid: false, message: "not started" });
    if ((coupon as any).expiresAt && now > (coupon as any).expiresAt) return res.status(400).json({ valid: false, message: "expired" });
    if ((coupon as any).maxUses !== null && (coupon as any).maxUses !== undefined && (coupon as any).usedCount >= (coupon as any).maxUses) {
      return res.status(400).json({ valid: false, message: "usage limit reached" });
    }
    if ((coupon as any).minOrderAmount && total < (coupon as any).minOrderAmount) {
      return res.status(400).json({ valid: false, message: "order total too low" });
    }

    let discountAmount = 0;
    if ((coupon as any).discountType === "percent") {
      discountAmount = (total * (coupon as any).value) / 100;
    } else {
      discountAmount = (coupon as any).value;
    }
    if (discountAmount > total) discountAmount = total;
    const finalTotal = +(total - discountAmount).toFixed(2);
    return res.json({ valid: true, discountAmount, finalTotal, coupon });
  } catch (err) {
    return res.status(500).json({ valid: false, message: "failed" });
  }
};

// Public: list currently active coupons (for Navbar/Home)
export const getActiveCoupons = async (req: Request, res: Response) => {
  try {
    const limit = Number((req.query.limit as string) || 10);
    const now = new Date();
    const coupons = await Coupon.findAll({
      where: {
        status: "active",
        [Op.and]: [
          { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
          { [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gte]: now } }] },
        ],
      },
  order: [["updatedAt", "DESC"]],
      limit: isNaN(limit) ? 10 : limit,
    });
    return res.json({ coupons });
  } catch (err) {
    return res.status(500).json({ message: "failed" });
  }
};
