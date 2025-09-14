import sequelize from "../database/connection";
import { DataTypes } from "sequelize";

export async function migrateTableWithId(tableName: string, newPrimaryKey: string = "id") {
  try {
    console.log(`🔄 Starting ${tableName} table migration...`);

    // First, check if the table exists and what columns it has
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '${tableName}' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log(`📋 Current ${tableName} table structure:`, results);

    // Check if id column already exists
    const hasIdColumn = (results as any[]).some(row => row.column_name === newPrimaryKey);

    if (!hasIdColumn) {
      console.log(`➕ Adding ${newPrimaryKey} column to ${tableName} table...`);

      // Step 1: Add the id column as nullable first
      await sequelize.query(`
        ALTER TABLE "${tableName}"
        ADD COLUMN "${newPrimaryKey}" UUID DEFAULT gen_random_uuid();
      `);

      // Step 2: Update all existing rows with UUID values
      await sequelize.query(`
        UPDATE "${tableName}"
        SET "${newPrimaryKey}" = gen_random_uuid()
        WHERE "${newPrimaryKey}" IS NULL;
      `);

      // Step 3: Make the column NOT NULL
      await sequelize.query(`
        ALTER TABLE "${tableName}"
        ALTER COLUMN "${newPrimaryKey}" SET NOT NULL;
      `);

      // Step 4: Check if there's an existing primary key and drop it
      const [pkResults] = await sequelize.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = '${tableName}'
        AND constraint_type = 'PRIMARY KEY';
      `);

      if ((pkResults as any[]).length > 0) {
        const pkName = (pkResults as any[])[0].constraint_name;
        console.log(`🗑️ Dropping existing primary key: ${pkName}`);
        await sequelize.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT "${pkName}";`);
      }

      // Step 5: Add new primary key
      await sequelize.query(`
        ALTER TABLE "${tableName}"
        ADD CONSTRAINT "${tableName}_pkey" PRIMARY KEY ("${newPrimaryKey}");
      `);

      console.log(`✅ Successfully migrated ${tableName} table with ${newPrimaryKey} column`);
    } else {
      console.log(`ℹ️ ${newPrimaryKey} column already exists in ${tableName} table`);
    }

    return { results, columnNames: (results as any[]).map(row => row.column_name) };

  } catch (error) {
    console.error(`❌ ${tableName} table migration failed:`, error);
    throw error;
  }
}

export async function migrateCartTable() {
  try {
    const { columnNames } = await migrateTableWithId('carts');

    // Add cart-specific columns
    if (!columnNames.includes('appliedDiscount')) {
      console.log("➕ Adding appliedDiscount column...");
      await sequelize.query(`
        ALTER TABLE "carts"
        ADD COLUMN "appliedDiscount" JSON DEFAULT NULL;
      `);
    }

    if (!columnNames.includes('taxRate')) {
      console.log("➕ Adding taxRate column...");
      await sequelize.query(`
        ALTER TABLE "carts"
        ADD COLUMN "taxRate" FLOAT DEFAULT 0.18;
      `);
    }

    if (!columnNames.includes('shipping')) {
      console.log("➕ Adding shipping column...");
      await sequelize.query(`
        ALTER TABLE "carts"
        ADD COLUMN "shipping" FLOAT DEFAULT 0;
      `);
    }

    console.log("✅ Cart table migration completed successfully");
    return true;

  } catch (error) {
    console.error("❌ Cart table migration failed:", error);
    throw error;
  }
}

export async function migrateWishlistTable() {
  try {
    await migrateTableWithId('wishlists');
    console.log("✅ Wishlist table migration completed successfully");
    return true;

  } catch (error) {
    console.error("❌ Wishlist table migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      await migrateCartTable();
      await sequelize.close();
      console.log("🎉 Migration completed!");
      process.exit(0);
    } catch (error) {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    }
  })();
}
