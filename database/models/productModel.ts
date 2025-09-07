import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";
import ProductCategory from "./productCategoryModel";

class Product extends Model {
  public productId!: string;
  public productName!: string;
  public categoryId!: string;
  public productPrice!: number;
  public productQuantity!: number;
  public description?: string;
  public productDiscount?: number;
  public imageUrl?: string;
  public soldQuantity?: number;
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
