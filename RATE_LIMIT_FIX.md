# Rate Limiting Fix for Cart/Wishlist 429 Errors

## Problem Identified
The frontend was hitting rate limits due to:
1. **Excessive polling**: Making dozens of requests per minute to cart/wishlist endpoints
2. **Low rate limits**: General rate limit was 100 requests per 15 minutes (too restrictive)
3. **No distinction**: Same rate limit for read vs write operations

## Changes Made

### 1. Environment Variables (.env)
```properties
# Added generous general rate limits
GENERAL_RATE_LIMIT_MAX_REQUESTS=1000
GENERAL_RATE_LIMIT_WINDOW_MINUTES=15
```

### 2. Cart Route (cartRoute.ts)
- **Read operations**: 300 requests/minute (very generous for polling)
- **Write operations**: 100 requests/minute (prevents abuse)
- Separated GET requests from POST/PUT requests with different rate limits

### 3. Wishlist Route (wishlistRoute.ts)
- **Read operations**: 300 requests/minute (very generous for polling)
- **Write operations**: 100 requests/minute (prevents abuse)

## Rate Limit Summary

| Operation | Endpoint | Rate Limit | Window | Purpose |
|-----------|----------|------------|--------|---------|
| Cart Read | GET /api/cart/:userId | 300/min | 1 min | Allow frequent polling |
| Cart Write | POST/PUT /api/cart/* | 100/min | 1 min | Prevent abuse |
| Wishlist Read | GET /api/wishlist/:userId | 300/min | 1 min | Allow frequent polling |
| Wishlist Write | POST /api/wishlist/* | 100/min | 1 min | Prevent abuse |
| General | All other APIs | 1000/15min | 15 min | Normal usage |
| Auth | Login/Register | 50/1min | 1 min | Security |

## Frontend Recommendations

To further reduce API calls, the frontend should implement:

1. **Debouncing**: Don't make cart requests more than once every 2-3 seconds
2. **Caching**: Cache cart/wishlist data for 30-60 seconds
3. **Event-driven updates**: Only refresh on user actions, not on every component mount
4. **Request deduplication**: Prevent multiple simultaneous requests to same endpoint

## Testing
After restart, the 429 errors should be resolved for normal usage patterns while still protecting against abuse.
