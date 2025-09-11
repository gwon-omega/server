import bcrypt from "bcrypt";
import User from "../database/models/userModel";
import { Op } from "sequelize";
import { connectDB } from "../database/connection";

interface SeedResult { created: number; skipped: number; }

const USERS = [
  { email: "admin@dgit.com.np", password: "admin", role: "admin", phoneNumber: "9800000000" },
  { email: "user@dgit.com.np", password: "user", role: "user", phoneNumber: "9800000001" },
];

export async function seedUsers(): Promise<SeedResult> {
  const existing = await User.findAll({ where: { email: { [Op.in]: USERS.map(u => u.email) } } });
  const existingSet = new Set(existing.map(u => u.email.toLowerCase()));
  let created = 0;
  for (const u of USERS) {
    if (existingSet.has(u.email.toLowerCase())) continue;
    const saltRounds = Number(process.env.BCRYPT_SALT) || 10;
    const hash = await bcrypt.hash(u.password, saltRounds);
    await User.create({ email: u.email, password: hash, role: u.role, phoneNumber: u.phoneNumber });
    created++;
  }
  return { created, skipped: USERS.length - created };
}

// Direct run support: pnpm exec ts-node scripts/seedUsers.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  (async () => {
    try {
      await connectDB({ sync: true });
      const result = await seedUsers();
      console.log("User seed result", result);
      process.exit(0);
    } catch (e) {
      console.error("User seed failed", e);
      process.exit(1);
    }
  })();
}

export default seedUsers;
