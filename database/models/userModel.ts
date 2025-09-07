import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class User extends Model {
  public userId!: string;
  public email!: string;
  public password!: string;
  public phoneNumber!: string;
}

User.init(
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "banned"),
      allowNull: false,
      defaultValue: "active",
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
  }
);

export default User;
