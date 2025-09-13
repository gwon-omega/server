import bcrypt from "bcryptjs";
import User from "../database/models/userModel";
import { Op } from "sequelize";
import { connectDB } from "../database/connection";

interface SeedResult { created: number; updated: number; skipped: number; }

// Base test accounts for frontend role-based flows
const USERS = [
  { email: "admin@dgit.com.np", password: "admin", role: "admin", phoneNumber: "9800000000", bankAccountNumber: "1234567890123456", address: "Kathmandu, Ward 1", mapAddress: "https://maps.google.com/?q=27.7172,85.3240" },
  { email: "user@dgit.com.np", password: "user", role: "user", phoneNumber: "9800000001", bankAccountNumber: "1234567890123457", address: "Bhaktapur, Ward 4", mapAddress: "https://maps.google.com/?q=27.6710,85.4298" },
  { email: "moderator@dgit.com.np", password: "moderator", role: "moderator", phoneNumber: "9800000002", bankAccountNumber: "1234567890123458", address: "Lalitpur, Ward 7", mapAddress: "https://maps.google.com/?q=27.6588,85.3247" },
  { email: "vendor@dgit.com.np", password: "vendor", role: "vendor", phoneNumber: "9800000003", bankAccountNumber: "1234567890123459", address: "Pokhara, Ward 9", mapAddress: "https://maps.google.com/?q=28.2096,83.9856" },
];

export async function seedUsers(): Promise<SeedResult> {
  const targetEmails = USERS.map(u => u.email).filter(Boolean);
  let created = 0;
  let updated = 0;
  for (const u of USERS) {
    if (!u.email) continue;
    const found = await User.findOne({ where: { email: u.email } });
    if (found) {
      // ensure new fields are set for existing users
      const needsUpdate = (!((found as any).bankAccountNumber)) || (!((found as any).address)) || (!((found as any).mapAddress));
      if (needsUpdate) {
        await (found as any).update({ bankAccountNumber: u.bankAccountNumber, address: u.address, mapAddress: u.mapAddress });
        updated++;
      }
      continue;
    }
    const saltRounds = Number(process.env.BCRYPT_SALT) || 10;
    const hash = await bcrypt.hash(u.password, saltRounds);
  await User.create({ email: u.email, password: hash, role: u.role, phoneNumber: u.phoneNumber, bankAccountNumber: u.bankAccountNumber, address: u.address, mapAddress: u.mapAddress });
    created++;
  }
  return { created, updated, skipped: USERS.length - created - updated };
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
