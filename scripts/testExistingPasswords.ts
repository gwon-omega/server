import User from "../database/models/userModel";
import bcrypt from "bcryptjs";
import { connectDB } from "../database/connection";

async function testExistingPasswords() {
  console.log("🔐 Testing existing user passwords with bcryptjs...");

  await connectDB();

  const users = await User.findAll({
    attributes: ['email', 'password'],
    raw: true
  });

  console.log(`\nFound ${users.length} users in database`);

  // Test passwords based on seeding script
  const testPasswords = {
    "admin@dgit.com.np": "admin",
    "user@dgit.com.np": "user",
    "moderator@dgit.com.np": "moderator",
    "vendor@dgit.com.np": "vendor"
  };

  for (const user of users) {
    const testPassword = testPasswords[user.email as keyof typeof testPasswords];
    console.log(`\nTesting password for: ${user.email} (password: "${testPassword}")`);
    try {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    } catch (error) {
      console.log(`❌ Error verifying password: ${error}`);
    }
  }

  console.log("\n🎉 Password verification tests completed!");
  process.exit(0);
}

testExistingPasswords().catch(console.error);
