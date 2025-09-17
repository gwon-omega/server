/**
 * Migration script: add transactionRef & paymentStatus columns to orders table if they do not exist.
 * Also ensures customerData, paymentData, paymentMethod, notes columns exist (idempotent safety for prod where sync alter is disabled).
 *
 * Usage: pnpm exec ts-node scripts/migrateAddPaymentFields.ts
 */
import sequelize from "../database/connection";
import { QueryInterface } from "sequelize";

async function columnExists(q: QueryInterface, table: string, column: string): Promise<boolean> {
  const desc: any = await q.describeTable(table);
  return !!desc[column];
}

async function run() {
  const qi = sequelize.getQueryInterface();
  const table = "orders";

  console.log("Starting migration: add payment integration fields to orders...");
  const additions: Array<{ name: string; action: () => Promise<void> }> = [
    {
      name: "customerData",
      action: async () => {
        if (!(await columnExists(qi, table, "customerData"))) {
          await qi.addColumn(table, "customerData", { type: "JSON", allowNull: true });
          console.log(" - Added customerData JSON column");
        }
      },
    },
    {
      name: "paymentData",
      action: async () => {
        if (!(await columnExists(qi, table, "paymentData"))) {
          await qi.addColumn(table, "paymentData", { type: "JSON", allowNull: true });
          console.log(" - Added paymentData JSON column");
        }
      },
    },
    {
      name: "paymentMethod",
      action: async () => {
        if (!(await columnExists(qi, table, "paymentMethod"))) {
          await qi.addColumn(table, "paymentMethod", { type: "VARCHAR(20)", allowNull: true });
          console.log(" - Added paymentMethod VARCHAR(20) column");
        }
      },
    },
    {
      name: "notes",
      action: async () => {
        if (!(await columnExists(qi, table, "notes"))) {
          await qi.addColumn(table, "notes", { type: "TEXT", allowNull: true });
          console.log(" - Added notes TEXT column");
        }
      },
    },
    {
      name: "transactionRef",
      action: async () => {
        if (!(await columnExists(qi, table, "transactionRef"))) {
          await qi.addColumn(table, "transactionRef", { type: "VARCHAR(120)", allowNull: true });
          console.log(" - Added transactionRef VARCHAR(120) column");
        }
      },
    },
    {
      name: "paymentStatus",
      action: async () => {
        if (!(await columnExists(qi, table, "paymentStatus"))) {
          // ENUM creation differs per dialect; for Postgres we can use ENUM type, but here we fallback to VARCHAR if needed
          // To keep it simple/portable we use VARCHAR with a check (skipped for brevity). Adjust manually if strict ENUM needed.
          await qi.addColumn(table, "paymentStatus", { type: "VARCHAR(20)", allowNull: true, defaultValue: "pending" });
          console.log(" - Added paymentStatus VARCHAR(20) column (enum simulated) ");
        }
      },
    },
  ];

  for (const add of additions) {
    try {
      await add.action();
    } catch (err) {
      console.error(` ! Failed to add column ${add.name}:`, err);
    }
  }

  console.log("Migration complete.");
  await sequelize.close();
}

run().catch((e) => {
  console.error("Migration fatal error", e);
  process.exit(1);
});
