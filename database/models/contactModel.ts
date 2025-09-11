import { DataTypes, Model } from "sequelize";
import sequelize from "../connection";

class Contact extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public subject!: string;
  public message!: string;
  public status!: string; // new|read|archived
  public respondedAt?: Date | null;
}

Contact.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      validate: { isEmail: true },
    },
    subject: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("new", "read", "archived"),
      allowNull: false,
      defaultValue: "new",
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "contact_messages",
    modelName: "Contact",
    indexes: [
      { fields: ["email"] },
      { fields: ["status"] },
      { fields: ["createdAt"] },
    ],
  }
);

export default Contact;
