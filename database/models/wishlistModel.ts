import sequelize from "../connection";
import { DataTypes, Model, Optional } from "sequelize";
import User from "./userModel";
import Product from "./productModel";

interface WishlistAttributes {
  id: string;
  userId: string;
  productId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Make `id` optional for creation
interface WishlistCreationAttributes extends Optional<WishlistAttributes, "id"> {}

class Wishlist extends Model<WishlistAttributes, WishlistCreationAttributes> implements WishlistAttributes {
  public id!: string;
  public userId!: string;
  public productId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;
  public readonly product?: Product;
}

Wishlist.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users", // table name
        key: "userId",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "products",
        key: "productId",
      },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "Wishlist",
    tableName: "wishlists",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "productId"], // prevent duplicates
      },
    ],
  }
);

// Associations
User.hasMany(Wishlist, { foreignKey: "userId", as: "wishlists" });
Wishlist.belongsTo(User, { foreignKey: "userId", as: "user" });

Product.hasMany(Wishlist, { foreignKey: "productId", as: "wishlists" });
Wishlist.belongsTo(Product, { foreignKey: "productId", as: "product" });

export default Wishlist;
