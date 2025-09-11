import sequelize from "../connection";
import { DataTypes, Model, Optional } from "sequelize";

interface CartAttributes {
  userId: string;
  items: any[];
  total: number;
}

type CartCreationAttributes = Optional<CartAttributes, "items" | "total">;

class Cart extends Model<CartAttributes, CartCreationAttributes> implements CartAttributes {
  public userId!: string;
  public items!: any[];
  public total!: number;
}

Cart.init(
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
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
  },
  {
    sequelize,
    modelName: "Cart",
    tableName: "carts",
  }
);

export default Cart;
