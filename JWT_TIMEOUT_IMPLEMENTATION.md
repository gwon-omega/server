# JWT Token Timeout Implementation - 15 Days

## Summary
JWT token timeout has been successfully implemented and configured to **15 days** as requested. The implementation uses environment variables for flexibility and maintains security best practices.

## Changes Made

### 1. Environment Configuration (`.env`)
Added JWT expiration configuration:
```properties
JWT_EXPIRES_IN=15d
```

### 2. Authentication Controller (`controllers/auth/authController.ts`)
Updated to use environment variable for token expiration:

**Before:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "yo_mero_secret_key_ho";
// Hardcoded 7 days
const token = jwt.sign({ ... }, JWT_SECRET, { expiresIn: "7d" });
```

**After:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "yo_mero_secret_key_ho";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15d";
// Dynamic expiration from environment
const token = jwt.sign({ ... }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
```

### 3. Token Utility (`utils/genToken.ts`)
Updated default expiration from 7 days to 15 days:

**Before:**
```typescript
export const genToken = (payload: object, expiresIn = "7d") => {
```

**After:**
```typescript
export const genToken = (payload: object, expiresIn = process.env.JWT_EXPIRES_IN || "15d") => {
```

## Implementation Details

### Token Expiration Locations Updated:
1. **User Registration** - New accounts get 15-day tokens
2. **User Login** - Login tokens expire in 15 days
3. **Utility Function** - Default token generation uses 15 days

### Security Considerations Maintained:
- **Password Reset Tokens** remain at 1 hour (unchanged for security)
- **PIN-based Recovery** remains at 15 minutes (unchanged for security)
- **JWT Secret** remains configurable via environment

## Configuration Options

The JWT expiration can be configured using various formats:
- `15d` - 15 days (current setting)
- `360h` - 360 hours (equivalent to 15 days)
- `21600m` - 21600 minutes (equivalent to 15 days)
- `1296000s` - 1296000 seconds (equivalent to 15 days)

## Verification

### Environment Variable Check:
```bash
# Check current configuration
echo $JWT_EXPIRES_IN
# Should output: 15d
```

### Token Duration Calculation:
- **15 days** = 1,296,000 seconds
- **Previous setting (7 days)** = 604,800 seconds
- **Increase**: +691,200 seconds (+8 days)

## Testing

To verify the implementation, you can run:
```bash
pnpm exec ts-node scripts/testJWTTimeout.ts
```

This will:
1. Generate a test JWT token
2. Decode and verify the expiration
3. Confirm it's set to exactly 15 days
4. Test both direct JWT signing and the utility function

## Backward Compatibility

- If `JWT_EXPIRES_IN` is not set in environment, defaults to "15d"
- Existing tokens remain valid until their original expiration
- No breaking changes to API responses or token structure

## Security Notes

### Longer Token Lifetime Implications:
- ✅ **Convenience**: Users stay logged in longer
- ⚠️ **Security Trade-off**: Compromised tokens remain valid longer
- 🔒 **Mitigation**: Strong JWT secret and HTTPS in production

### Token Validation:
- Expired tokens are properly rejected with 401 status
- Token expiration is checked in middleware on every request
- Clear error messages for expired tokens

## Production Recommendations

1. **Monitor Token Usage**: Track token expiration patterns
2. **Consider Refresh Tokens**: For even longer sessions without security compromise
3. **Implement Token Blacklist**: For immediate token revocation if needed
4. **HTTPS Only**: Ensure tokens are transmitted securely
5. **Strong JWT Secret**: Use cryptographically secure secret in production

## Files Modified

1. `.env` - Added JWT_EXPIRES_IN configuration
2. `controllers/auth/authController.ts` - Updated register and login functions
3. `utils/genToken.ts` - Updated default expiration
4. `scripts/testJWTTimeout.ts` - Created verification script

## Status: ✅ COMPLETED

JWT token timeout has been successfully implemented and set to **15 days** as requested. All authentication flows now use the configurable expiration time while maintaining security best practices for password reset flows.
