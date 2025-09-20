import sequelize from "../connection";
import { DataTypes, Model, Optional } from "sequelize";
import User from "./userModel";

/**
 * Applied discount structure for cart-level discounts
 */
interface AppliedDiscount {
  id?: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
}

/**
 * Cart model attributes - normalized approach without JSON items
 */
interface CartAttributes {
  cartId: string;
  userId: string;
  appliedDiscount?: AppliedDiscount | null;
  taxRate?: number;
  shipping?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type CartCreationAttributes = Optional<CartAttributes, "cartId" | "appliedDiscount" | "taxRate" | "shipping">;

/**
 * Normalized Cart model - items stored in separate cart_items table
 */
class Cart extends Model<CartAttributes, CartCreationAttributes> implements CartAttributes {
  declare cartId: string;
  declare userId: string;
  declare appliedDiscount: AppliedDiscount | null;
  declare taxRate: number;
  declare shipping: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations - items will come from CartItem model
  declare readonly user?: User;
  declare readonly items?: any[]; // Will be properly typed when CartItem is imported
}

Cart.init(
  {
    cartId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "userId" },
      unique: true,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    appliedDiscount: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    taxRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0.13,
    },
    shipping: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Cart",
    tableName: "carts",
    timestamps: true, // createdAt and updatedAt
  }
);

// Associations
User.hasOne(Cart, { foreignKey: "userId", as: "cart" });
Cart.belongsTo(User, { foreignKey: "userId", as: "user" });

export default Cart;
