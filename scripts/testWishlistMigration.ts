import { migrateWishlistTable } from "./migrateCartTable";
import sequelize from "../database/connection";

async function testWishlistMigration() {
  try {
    console.log("🧪 Testing wishlist migration...");

    // First authenticate with the database
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Run the wishlist migration
    await migrateWishlistTable();

    console.log("✅ Wishlist migration test completed successfully");
    process.exit(0);

  } catch (error) {
    console.error("❌ Wishlist migration test failed:", error);
    process.exit(1);
  }
}

testWishlistMigration();
