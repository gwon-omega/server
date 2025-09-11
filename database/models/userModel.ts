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
}

type UserCreationAttributes = Optional<UserAttributes, "userId" | "imageUrl" | "status" | "role">;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public userId!: string;
  public email!: string;
  public password!: string;
  public phoneNumber!: string;
  public imageUrl!: string | null;
  public status!: string;
  public role!: string;
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
