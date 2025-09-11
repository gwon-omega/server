import sequelize from "../connection";
import { DataTypes, Model, Optional } from "sequelize";

interface ForgotPasswordAttributes {
  id: string;
  userId: string;
  pin: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type ForgotPasswordCreationAttributes = Optional<ForgotPasswordAttributes, "id" | "used" | "expiresAt">;

class ForgotPassword extends Model<ForgotPasswordAttributes, ForgotPasswordCreationAttributes> implements ForgotPasswordAttributes {
  public id!: string;
  public userId!: string;
  public pin!: string;
  public expiresAt!: Date;
  public used!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ForgotPassword.init(
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
    },
    pin: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "ForgotPassword",
    tableName: "forgot_passwords",
    timestamps: true,
  }
);

export default ForgotPassword;

