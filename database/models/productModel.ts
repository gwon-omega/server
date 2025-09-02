import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class Product extends Model {
  public productId!: number;
  public productName!: string;
  public productCategory!: string;
  public productPrice!: number;
  public productQuantity!: number;
  public description?: string;
}

Product.init(
  {
    productId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productCategory: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    productDiscount:{
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    productQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Product",
    tableName: "products",
  }
);

export default Product;
