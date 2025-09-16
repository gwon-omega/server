import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "yo_mero_secret_key_ho";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15d";

console.log("🔐 Testing JWT Token Configuration");
console.log("================================");
console.log(`JWT_SECRET: ${JWT_SECRET.substring(0, 10)}...`);
console.log(`JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}`);

// Test token generation
const testPayload = {
  id: "test-user-id",
  email: "test@example.com",
  role: "user"
};

const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
const decoded = jwt.decode(token) as any;

if (decoded && decoded.exp) {
  const issuedAt = new Date(decoded.iat * 1000);
  const expiresAt = new Date(decoded.exp * 1000);
  const durationMs = (decoded.exp - decoded.iat) * 1000;
  const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
  const durationHours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  console.log("\n📊 Token Details:");
  console.log(`Issued At: ${issuedAt.toISOString()}`);
  console.log(`Expires At: ${expiresAt.toISOString()}`);
  console.log(`Duration: ${durationDays} days, ${durationHours} hours`);
  console.log(`Token (first 50 chars): ${token.substring(0, 50)}...`);

  if (durationDays === 15) {
    console.log("\n✅ SUCCESS: Token timeout is correctly set to 15 days!");
  } else {
    console.log(`\n❌ ERROR: Expected 15 days, but got ${durationDays} days`);
  }
} else {
  console.log("❌ ERROR: Could not decode token");
}

// Test using the genToken utility
import { genToken } from "../utils/genToken";

console.log("\n🛠️ Testing genToken utility:");
const utilityToken = genToken(testPayload);
const utilityDecoded = jwt.decode(utilityToken) as any;

if (utilityDecoded && utilityDecoded.exp) {
  const durationMs = (utilityDecoded.exp - utilityDecoded.iat) * 1000;
  const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));

  console.log(`Utility token duration: ${durationDays} days`);

  if (durationDays === 15) {
    console.log("✅ SUCCESS: genToken utility also correctly uses 15 days!");
  } else {
    console.log(`❌ ERROR: genToken utility expected 15 days, but got ${durationDays} days`);
  }
} else {
  console.log("❌ ERROR: Could not decode utility token");
}

console.log("\n🔍 Environment Variables Check:");
console.log(`process.env.JWT_EXPIRES_IN = "${process.env.JWT_EXPIRES_IN}"`);
console.log(`Default fallback = "15d"`);
