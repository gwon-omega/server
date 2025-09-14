import sequelize from "../connection";
import { DataTypes, Model, Optional } from "sequelize";

export interface CouponAttributes {
  couponId: string;
  code: string; // unique, uppercase stored
  discountType: "percent" | "fixed";
  value: number; // percent (0-100) or fixed amount (>0)
  maxUses?: number | null; // null = unlimited
  usedCount: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  status: "active" | "inactive";
  minOrderAmount?: number | null; // optional minimum order total to apply
  metadata?: Record<string, any> | null;
  imageUrl?: string | null;
}

type CouponCreationAttributes = Optional<CouponAttributes, "couponId" | "usedCount" | "startsAt" | "expiresAt" | "status" | "maxUses" | "minOrderAmount" | "metadata">;

class Coupon extends Model<CouponAttributes, CouponCreationAttributes> implements CouponAttributes {
  public couponId!: string;
  public code!: string;
  public discountType!: "percent" | "fixed";
  public value!: number;
  public maxUses!: number | null;
  public usedCount!: number;
  public startsAt!: Date | null;
  public expiresAt!: Date | null;
  public status!: "active" | "inactive";
  public minOrderAmount!: number | null;
  public metadata!: Record<string, any> | null;
  public imageUrl!: string | null;
}

Coupon.init(
  {
    couponId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    discountType: {
      type: DataTypes.ENUM("percent", "fixed"),
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    maxUses: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    startsAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    minOrderAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Coupon",
    tableName: "coupons",
    indexes: [
      { unique: true, fields: ["code"] },
      { fields: ["status"] },
    ],
    hooks: {
      beforeValidate: (coupon: any) => {
        if (coupon.code) coupon.code = String(coupon.code).trim().toUpperCase();
      },
    },
  }
);

export default Coupon;
