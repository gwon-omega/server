// cartItemModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../connection";
import Cart from "./cartModel";
import Product from "./productModel";

/**
 * CartItem model attributes for normalized cart_items table
 */
interface CartItemAttributes {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type CartItemCreationAttributes = Optional<CartItemAttributes, "id">;

/**
 * Normalized CartItem model - represents individual items in a cart
 */
class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> implements CartItemAttributes {
  declare id: string;
  declare cartId: string;
  declare productId: string;
  declare quantity: number;
  declare price: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare readonly cart?: Cart;
  declare readonly product?: any; // Will be properly typed when Product model is standardized
}

CartItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "carts", key: "cartId" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "products", key: "productId" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 99
      }
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
  },
  {
    sequelize,
    modelName: "CartItem",
    tableName: "cart_items",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['cartId', 'productId'] // Prevent duplicate products in same cart
      }
    ]
  }
);

// Associations - Establish relationships between models
Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items", onDelete: "CASCADE" });
CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });
Product.hasMany(CartItem, { foreignKey: "productId", as: "cartItems" });
CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

export default CartItem;
