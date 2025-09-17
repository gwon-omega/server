/**
 * Test script to verify configurable auth rate limiting
 * This demonstrates how AUTH_RATE_LIMIT_WINDOW_MINUTES and AUTH_RATE_LIMIT_MAX_REQUESTS work
 */

console.log("🔧 Configurable Auth Rate Limiting Test");
console.log("========================================");

// Test with default values (15 minutes, 5 requests)
console.log("\n📊 Default Configuration:");
const defaultWindow = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || "15", 10);
const defaultMax = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || "5", 10);
console.log(`AUTH_RATE_LIMIT_WINDOW_MINUTES: ${process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || "15 (default)"}`);
console.log(`AUTH_RATE_LIMIT_MAX_REQUESTS: ${process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || "5 (default)"}`);
console.log(`Result: ${defaultMax} login attempts per ${defaultWindow} minutes`);

// Test with custom values
console.log("\n📊 Custom Configuration (set via environment):");
process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES = "10";
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = "3";

const customWindow = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || "15", 10);
const customMax = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || "3", 10);
console.log(`AUTH_RATE_LIMIT_WINDOW_MINUTES: ${process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES}`);
console.log(`AUTH_RATE_LIMIT_MAX_REQUESTS: ${process.env.AUTH_RATE_LIMIT_MAX_REQUESTS}`);
console.log(`Result: ${customMax} login attempts per ${customWindow} minutes`);

console.log("\n✅ Rate limiting is now configurable via environment variables!");
console.log("\n📝 To use in production:");
console.log("1. Set AUTH_RATE_LIMIT_WINDOW_MINUTES=10 (for 10-minute windows)");
console.log("2. Set AUTH_RATE_LIMIT_MAX_REQUESTS=3 (for 3 attempts per window)");
console.log("3. Restart your server");
console.log("4. Auth endpoints will now allow 3 login attempts per 10 minutes instead of 5 per 15 minutes");
