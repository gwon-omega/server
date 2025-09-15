import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class ProductCategory extends Model {}

ProductCategory.init(
  {
    categoryId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    categoryName: {
      type: DataTypes.STRING,
      allowNull: false,
  unique: true,
    },
  },
  {
    sequelize,
    modelName: "ProductCategory",
    tableName: "product_categories",
  }
);

export default ProductCategory;
