import bcrypt from "bcryptjs";
import { generatePassword, comparePassword } from "../utils/genPass";

async function testBcryptjs() {
  console.log("🔐 Testing bcryptjs functionality...");

  const testPassword = "testPassword123";

  // Test direct bcryptjs usage
  console.log("\n1. Testing direct bcryptjs usage:");
  const hashedDirect = await bcrypt.hash(testPassword, 10);
  console.log(`Original password: ${testPassword}`);
  console.log(`Hashed password: ${hashedDirect}`);

  const isValidDirect = await bcrypt.compare(testPassword, hashedDirect);
  console.log(`Password verification: ${isValidDirect ? '✅ Valid' : '❌ Invalid'}`);

  // Test utility functions
  console.log("\n2. Testing utility functions (genPass.ts):");
  const hashedUtil = await generatePassword(testPassword);
  console.log(`Hashed with utility: ${hashedUtil}`);

  const isValidUtil = await comparePassword(testPassword, hashedUtil);
  console.log(`Utility verification: ${isValidUtil ? '✅ Valid' : '❌ Invalid'}`);

  // Test wrong password
  console.log("\n3. Testing wrong password:");
  const isInvalid = await comparePassword("wrongPassword", hashedUtil);
  console.log(`Wrong password test: ${isInvalid ? '❌ Should be false' : '✅ Correctly rejected'}`);

  console.log("\n🎉 All bcryptjs tests completed!");
}

testBcryptjs().catch(console.error);
