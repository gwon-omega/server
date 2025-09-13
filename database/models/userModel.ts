import sequelize from "../connection";
import { DataTypes, Model, Optional } from "sequelize";

interface UserAttributes {
  userId: string;
  email: string;
  password: string;
  phoneNumber: string;
  imageUrl?: string | null;
  status: string;
  role: string;
  bankAccountNumber?: string | null;
  address?: string | null;
  mapAddress?: string | null;
}

type UserCreationAttributes = Optional<UserAttributes, "userId" | "imageUrl" | "status" | "role" | "bankAccountNumber" | "address" | "mapAddress">;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  // Declare attributes for typing without creating public class fields at runtime
  declare userId: string;
  declare email: string;
  declare password: string;
  declare phoneNumber: string;
  declare imageUrl: string | null;
  declare status: string;
  declare role: string;
  declare bankAccountNumber: string | null;
  declare address: string | null;
  declare mapAddress: string | null;
}

User.init(
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
    bankAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mapAddress: {
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
