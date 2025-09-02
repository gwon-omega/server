import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class Review extends Model {
  public reviewId!: string;
  public email!: string;
  public message!: string; // JSON array of { productId, quantity, price }
  public rating!: number;
  public status!: string;
}

Review.init(
  {
    reviewId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
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
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "Review",
    tableName: "reviews",
  }
);

export default Review;
