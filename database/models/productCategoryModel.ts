import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class ProductCategory extends Model {
  public categoryId!: string;
  public categoryName!: string;
}

ProductCategory.init(
  {
    categoryId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    categoryName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ProductCategory",
    tableName: "product_categories",
  }
);

export default ProductCategory;
