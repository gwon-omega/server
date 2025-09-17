import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class Order extends Model {}

Order.init(
  {
    orderId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    // New: persisted customer snapshot (non-sensitive)
    customerData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // New: sanitized payment info (never full card / cvv)
    paymentData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transactionRef: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending','initiated','completed','failed','refunded'),
      allowNull: true,
      defaultValue: 'pending'
    },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
  }
);

export default Order;
