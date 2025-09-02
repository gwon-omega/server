import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class Wishlist extends Model {
  public id!: string;
  public userId!: string;
  public productId!: string;
}

Wishlist.init(
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Wishlist",
    tableName: "wishlists",
  }
);

export default Wishlist;
