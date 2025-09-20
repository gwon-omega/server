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
    console.log('validateCoupon request body:', req.body);
    const { code, orderTotal, orderAmount } = req.body || {};
    const userId = (req as any).user?.userId || (req as any).user?.id;

    if (!code) {
      console.log('validateCoupon error: code required');
      return res.status(400).json({ valid: false, message: "code required" });
    }

    // Accept both orderTotal and orderAmount for backward compatibility
    const total = Number(orderTotal || orderAmount);
    console.log('validateCoupon parsed total:', total, 'from orderTotal:', orderTotal, 'orderAmount:', orderAmount);

    if (isNaN(total) || total <= 0) {
      console.log('validateCoupon error: invalid total value', { total, orderTotal, orderAmount });
      return res.status(400).json({ valid: false, message: "Order total must be a positive number" });
    }

    const coupon = await Coupon.findOne({ where: { code: String(code).trim().toUpperCase() } });
    if (!coupon) {
      console.log('validateCoupon error: coupon not found', code);
      return res.status(404).json({ valid: false, message: "Coupon code not found" });
    }

    // Get the coupon data as a plain object for easier access
    const couponData = coupon.toJSON();
    console.log('validateCoupon found coupon:', {
      code: couponData.code,
      status: couponData.status,
      discountType: couponData.discountType,
      value: couponData.value,
      minOrderAmount: couponData.minOrderAmount,
      usersUsed: couponData.usersUsed
    });

    const now = new Date();

    // Check if coupon is active
    if (couponData.status !== "active") {
      console.log('validateCoupon error: coupon inactive', couponData.status);
      return res.status(400).json({ valid: false, message: "Coupon is not active" });
    }

    // Check expiration and auto-deactivate if expired
    if (couponData.expiresAt && now > new Date(couponData.expiresAt)) {
      console.log('validateCoupon error: coupon expired', couponData.expiresAt);
      // Auto-deactivate expired coupon
      await coupon.update({ status: "inactive" });
      return res.status(400).json({ valid: false, message: "This coupon has expired" });
    }

    // Check if user has already used this coupon (one-time use per user)
    if (userId && couponData.usersUsed && couponData.usersUsed.includes(userId)) {
      console.log('validateCoupon error: user already used coupon', { userId, code: couponData.code });
      return res.status(400).json({ valid: false, message: "You have already used this code" });
    }

    // Check start date
    if (couponData.startsAt && now < new Date(couponData.startsAt)) {
      console.log('validateCoupon error: coupon not started', couponData.startsAt);
      return res.status(400).json({ valid: false, message: "Coupon is not yet valid" });
    }

    // Check usage limits
    if (couponData.maxUses !== null && couponData.maxUses !== undefined && couponData.usedCount >= couponData.maxUses) {
      console.log('validateCoupon error: usage limit reached', { maxUses: couponData.maxUses, usedCount: couponData.usedCount });
      return res.status(400).json({ valid: false, message: "Coupon usage limit reached" });
    }

    // Check minimum order amount
    if (couponData.minOrderAmount && total < couponData.minOrderAmount) {
      console.log('validateCoupon error: order total too low', { total, minOrderAmount: couponData.minOrderAmount });
      return res.status(400).json({ valid: false, message: `Minimum order amount is ${couponData.minOrderAmount}` });
    }

    let discountAmount = 0;
    if (couponData.discountType === "percent") {
      discountAmount = (total * couponData.value) / 100;
    } else {
      discountAmount = couponData.value;
    }
    if (discountAmount > total) discountAmount = total;
    const finalTotal = +(total - discountAmount).toFixed(2);

    console.log('validateCoupon success:', { discountAmount, finalTotal });
    return res.json({ valid: true, discountAmount, finalTotal, coupon: couponData });
  } catch (err) {
    console.error('validateCoupon exception:', err);
    return res.status(500).json({ valid: false, message: "Coupon validation failed" });
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
