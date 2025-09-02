import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class ForgotPassword extends Model {
  public id!: string;
  public userId!: string;
  public pin!: string;
  public expiresAt!: Date;
  public used!: boolean;
}

ForgotPassword.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUID,
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

