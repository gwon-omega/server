import sequelize from "../connection";
import { DataTypes, Model, Optional } from "sequelize";
import User from "./userModel";

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface AppliedDiscount {
  id?: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
}

interface CartAttributes {
  userId: string;
  items: CartItem[];
  total: number;
  appliedDiscount?: AppliedDiscount | null;
  taxRate?: number;
  shipping?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type CartCreationAttributes = Optional<CartAttributes, "items" | "total" | "appliedDiscount" | "taxRate" | "shipping">;

class Cart extends Model<CartAttributes, CartCreationAttributes> implements CartAttributes {
  declare userId: string;
  declare items: CartItem[];
  declare total: number;
  declare appliedDiscount: AppliedDiscount | null;
  declare taxRate: number;
  declare shipping: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Association
  declare readonly user?: User;
}

Cart.init(
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
      references: { model: "users", key: "userId" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    appliedDiscount: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    taxRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0.18,
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
