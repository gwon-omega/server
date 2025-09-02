import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class Cart extends Model {
  public userId!: string;
  public items!: any; // JSON array of { productId, quantity, price }
  public total!: number;
}

Cart.init(
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUID,
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
