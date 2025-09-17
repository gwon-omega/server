import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";
import Product from "./productModel";

class Review extends Model {}

Review.init(
  {
    reviewId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'products', key: 'productId' }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
  // Unified status values: published | pending | rejected
  // Default to published so newly created reviews appear immediately
  defaultValue: "published",
    },
  },
  {
    sequelize,
    modelName: "Review",
    tableName: "reviews",
    hooks: {
      beforeValidate: (review: any) => {
        if (review.email && typeof review.email === 'string') {
          review.email = review.email.trim().toLowerCase();
        }
      },
      beforeSave: (review: any) => {
        if (review.email && typeof review.email === 'string') {
          review.email = review.email.trim().toLowerCase();
        }
      }
    }
  }
);

export default Review;

// Associations (late binding to avoid circular issues)
try {
  Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
  Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
} catch {
  // silent if association already established during hot reload
}
