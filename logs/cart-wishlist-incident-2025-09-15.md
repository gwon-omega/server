# Incident Log: Cart & Wishlist issues (2025-09-15)

Status: mitigated

Scope: Client (Next.js) + Server (Express/Sequelize/Postgres)

## Summary

- Symptoms observed during manual testing:
  - After add-to-cart, items appeared to “disappear” on the cart page.
  - Wishlist page stuck in loading in some sessions.
  - API attempts via shell returned HTTP 500 with generic "internal error" while protected GETs worked.

- Root causes:
  - Inconsistent JWT secret defaults between the auth controller and the security middleware led to some tokens being rejected on protected routes.
  - On Windows, cURL/PowerShell quoting produced malformed JSON bodies for POST requests, causing 500s (JSON parse failure) and confusion during verification.
  - Client-side reducers/hooks needed stricter normalization and status handling to avoid transient empty states.

## Timeline

- 2025-09-15 05:40Z: Login verified OK. Protected GET /profile enforced token as expected.
- 2025-09-15 06:25Z: GET /wishlist/:userId and GET /cart/:userId return as expected.
- 2025-09-15 06:50Z: POST /cart/add returned 500. Dev error message (added) showed malformed JSON from shell quoting.
- 2025-09-15 06:55Z: POST /wishlist/add also 500 with same parse error when using shell; worked from client and proper JSON tools.
- 2025-09-15 07:00Z: Middleware default JWT secret unified with auth controller; dev error handler now includes messages; migrations hardened to ensure pgcrypto.

## Affected endpoints

- GET /api/cart/:userId (auth required) — OK
- POST /api/cart/add (auth required) — failed only when body JSON malformed (Windows shell quoting)
- PUT /api/cart/update (auth required) — same risk if malformed JSON
- POST /api/wishlist/add (auth required) — same risk
- POST /api/wishlist/remove (auth required) — same risk

## Server changes

- middleware/middleware.ts
  - Use same default JWT secret as auth controller (`yo_mero_secret_key_ho`) when `JWT_SECRET` unset to avoid token mismatch.
- server.ts
  - Global error handler returns `internal error: <message>` when NODE_ENV is not `production`.
- scripts/migrateCartTable.ts
  - Ensure `pgcrypto` extension before using `gen_random_uuid()` in migrations.

## Client-side hardening (prior work)

- hooks/useCart.ts
  - Normalize server responses; optimistic add with rollback; accept price=0; clear status transitions.
- hooks/useWishlist.ts
  - Normalize to productId[]; optimistic toggle with rollback; loading/error status handled.
- store/cartSlice.ts, store/wishlistSlice.ts
  - Robust reducers; status and totals discipline.

## Reproduction (Windows-safe)

- Prefer Postman/Insomnia or the UI. If using PowerShell, build JSON with ConvertTo-Json:

```powershell
$loginBody = @{ email='user@dgit.com.np'; password='user' } | ConvertTo-Json
$resp = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/login' -ContentType 'application/json' -Body $loginBody
$token = $resp.token
$uid = $resp.user.id
$addBody = @{ userId=$uid; productId='REPLACE_PRODUCT_ID'; quantity=1 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/cart/add' -Headers @{ Authorization = ('Bearer ' + $token) } -ContentType 'application/json' -Body $addBody
```

- Or run the provided smoke test script (axios-based):
  - `server/scripts/smokeCartWishlist.ts` — logs in, fetches a product, adds wishlist/cart, reads both back.

## Verification checklist

- [ ] Login returns 200 with token.
- [ ] GET /api/cart/:userId returns canonical shape with totals.
- [ ] POST /api/cart/add with valid JSON returns 200 and includes updated items; GET reflects the change.
- [ ] GET /api/wishlist/:userId returns items; POST /api/wishlist/add with valid JSON returns 201/200 and GET reflects the change.
- [ ] From the Next.js UI: add to cart and wishlist; navigate to /cart and /wishlist and see items without flicker/removal.

## Notes

- Server rejects cross-user writes: body `userId` must match JWT user; otherwise 403 forbidden.
- If you still see 500s, check the response body in dev — it now includes the error message.
- For production, ensure `JWT_SECRET` is set consistently across services.
