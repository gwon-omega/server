import sequelize from "../connection";
import { DataTypes, Model, Optional } from "sequelize";

interface CartAttributes {
  id: string;
  userId: string;
  items: any[];
  total: number;
  appliedDiscount?: {
    id?: string;
    code: string;
    type: 'percent' | 'fixed';
    value: number;
  } | null;
  taxRate?: number; // e.g., 0.18 for 18%
  shipping?: number; // flat shipping for now
}

type CartCreationAttributes = Optional<CartAttributes, "items" | "total">;

class Cart extends Model<CartAttributes, CartCreationAttributes> implements CartAttributes {
  public id!: string;
  public userId!: string;
  public items!: any[];
  public total!: number;
  public appliedDiscount?: CartAttributes['appliedDiscount'];
  public taxRate?: number;
  public shipping?: number;
}

Cart.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
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
  }
);

export default Cart;
