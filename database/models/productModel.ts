import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";
import ProductCategory from "./productCategoryModel";

class Product extends Model {
  // Declare attributes for typing without creating public class fields at runtime
  declare productId: string;
  declare productName: string;
  declare categoryId: string;
  declare productPrice: number;
  declare productQuantity: number;
  declare description: string | null;
  declare productDiscount: number | null;
  declare imageUrl: string | null;
  declare soldQuantity: number | null;
}

Product.init(
  {
    productId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "product_categories",
        key: "categoryId",
      },
    },
    productPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    productDiscount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    productQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    soldQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled", // enabled | disabled
    },
  },
  {
    sequelize,
    modelName: "Product",
    tableName: "products",
    timestamps: true,
  }
);

// Associations
ProductCategory.hasMany(Product, { foreignKey: "categoryId", as: "products" });
Product.belongsTo(ProductCategory, { foreignKey: "categoryId", as: "category" });

export default Product;
