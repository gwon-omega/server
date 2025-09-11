import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class Wishlist extends Model {}

Wishlist.init(
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
