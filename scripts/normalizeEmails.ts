import sequelize from "../database/connection";
import User from "../database/models/userModel";
import Contact from "../database/models/contactModel";
import Review from "../database/models/reviewModel";

async function run() {
  console.log("Starting email normalization...");
  const tx = await sequelize.transaction();
  try {
    const tasks: Array<Promise<any>> = [];

    const normalizeField = (record: any, field: string) => {
      const val = record.get(field);
      if (val && typeof val === 'string') {
        const lower = val.trim().toLowerCase();
        if (lower !== val) record.set(field, lower);
      }
    };

    const processModel = async (model: any, name: string, field: string) => {
      const rows = await model.findAll({ transaction: tx });
      let changed = 0;
      for (const row of rows) {
        const before = row.get(field);
        normalizeField(row, field);
        const after = row.get(field);
        if (before !== after) {
          await row.save({ transaction: tx, hooks: false });
          changed++;
        }
      }
      console.log(`${name}: ${changed} updated (${rows.length} scanned)`);
    };

    await processModel(User, 'User', 'email');
    await processModel(Contact, 'Contact', 'email');
    await processModel(Review, 'Review', 'email');

    await tx.commit();
    console.log("Email normalization completed successfully.");
  } catch (err: any) {
    await tx.rollback();
    console.error("Email normalization failed:", err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
