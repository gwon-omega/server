import * as dotenv from "dotenv";
dotenv.config();

import { Sequelize } from "sequelize";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is not defined");

const sequelize = new Sequelize(dbUrl, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // required by Supabase in many environments
    },
  },
  logging: console.log,
});

export async function connectDB(options?: { sync?: boolean }) {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    if (options?.sync) {
      // sync is potentially destructive in production; only run explicitly
      // Skip sync for cart table since we manually migrated it
      await sequelize.sync({ alter: true, force: false });
      console.log("✅ Database synchronized successfully.");
    }
  } catch (error) {
    console.error("❌ Database connection or synchronization failed:", error);
    throw error;
  }
}

export default sequelize;
