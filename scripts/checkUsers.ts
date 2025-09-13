import { connectDB } from "../database/connection";
import User from "../database/models/userModel";

(async () => {
  try {
    await connectDB();
  const users = await User.findAll({ attributes: ["userId", "email", "role", "status", "bankAccountNumber", "address", "mapAddress"], order: [["createdAt", "ASC"]], raw: true });
    console.log(`Found ${users.length} users:`);
    for (const u of users) {
  console.log(` - ${u.email} (role=${u.role}, status=${u.status}, bank=${u.bankAccountNumber ?? '-'}, address=${u.address ?? '-'}, map=${u.mapAddress ?? '-'})`);
    }
    process.exit(0);
  } catch (e) {
    console.error("Failed to check users", e);
    process.exit(1);
  }
})();
