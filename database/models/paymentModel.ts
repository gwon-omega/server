import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class Payment extends Model {
  public paymentId!: string;
  public transaction_uuid!: string;
  public platform!: string;
  public amount!: number;
  public status!: string;
  public ref_id?: string;
  public metadata?: object;
}

Payment.init(
  {
    paymentId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    transaction_uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ref_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Payment",
    tableName: "payments",
  }
);

export default Payment;
