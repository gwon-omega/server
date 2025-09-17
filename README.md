# 🛒 E-Commerce Backend API Documentation

## 📊 **For Frontend Developers**

This comprehensive guide provides all the technical specifications, API endpoints, authentication methods, database schemas, and integration patterns needed to build a robust frontend application for our e-commerce platform.

---

## 🚀 **Quick Start**

### **Server Configuration**
- **Base URL**: `http://localhost:{PORT}/api` (default PORT=5000)
- **Environment**: Node.js + TypeScript + PostgreSQL + Sequelize ORM
- **Framework**: Express.js with comprehensive security middleware
- **Authentication**: JWT Bearer Tokens (configurable expiration via JWT_EXPIRES_IN)
- **Rate Limiting**: Auth endpoints: 5 requests/15min, General: 100 requests/15min

### **Required Headers**
```javascript
// For authenticated requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${userToken}`,
  'User-Agent': 'YourAppName/1.0'
};

// For server-to-server or alternative auth on protected routes using `securityChecker`
// Either provide Authorization: Bearer <jwt> OR x-api-key matching API_KEY
const publicHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': 'your_api_key' // Optional substitute for Bearer token on applicable routes
};
```

---

## 🔐 **Authentication System**

### **JWT Token Structure**
```javascript
// Token Payload
{
  "userId": "uuid-v4-string",
  "email": "user@example.com",
  "role": "user|admin|vendor",
  "iat": 1694889600,
  "exp": 1696185600
}
```

### **Authentication Endpoints**

#### **POST `/api/auth/register`**
```javascript
// Request Body
{
  "email": "john@example.com",     // Required, valid email
  "password": "SecurePass123!",    // Required, 8+ chars with uppercase, lowercase, number, special
  "phoneNumber": "+1234567890",    // Required, valid phone number
  "bankAccountNumber": "1234567890", // Optional
  "address": "123 Main St",        // Optional
  "mapAddress": "Google Maps URL"  // Optional
}

// Success Response (201)
{
  "message": "registered",
  "user": {
    "id": "uuid-v4",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "jwt-token-string"
}

// Error Response (400)
{
  "message": "Missing required fields"
}

// Error Response (409)
{
  "message": "Email already in use"
}
```

#### **POST `/api/auth/login`**
```javascript
// Request Body
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

// Success Response (200)
{
  "message": "ok",
  "token": "jwt-token-string",
  "user": {
    "id": "uuid-v4",
    "email": "john@example.com",
    "role": "user"
  }
}

// Error Response (400)
{
  "message": "Missing credentials"
}

// Error Response (401)
{
  "message": "Invalid credentials"
}
```

#### **GET `/api/auth/profile`** (Protected)
```javascript
// Headers Required: Authorization: Bearer <token>

// Success Response (200)
{
  "user": {
    "userId": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "address": "123 Main St",
    "mapAddress": "Google Maps Link",
    "imageUrl": "profile-image-url",
    "role": "user",
    "status": "active",
    "bankAccountNumber": "encrypted-account",
    "createdAt": "2025-09-16T10:30:00.000Z",
    "updatedAt": "2025-09-16T10:30:00.000Z"
  }
}
```

### **Password Reset Flow**

#### **POST `/api/auth/forgot-password`**
```javascript
// Request Body
{
  "email": "john@example.com"
}

// Success Response (200)
{
  "success": true,
  "message": "Password reset PIN sent to email"
}
```

#### **POST `/api/auth/verify-pin`**
```javascript
// Request Body
{
  "email": "john@example.com",
  "pin": "123456" // 6-digit numeric PIN
}

// Success Response (200)
{
  "success": true,
  "message": "PIN verified successfully"
}
```

#### **POST `/api/auth/reset-password`**
```javascript
// Request Body
{
  "email": "john@example.com",
  "pin": "123456",
  "password": "NewSecurePass123!"
}

// Success Response (200)
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 🛍️ **Product Management**

### **Product Schema**
```javascript
// Product Object Structure
{
  "productId": "uuid-v4",
  "productName": "Organic Rice",
  "categoryId": "uuid-v4",
  "productPrice": 15.99,
  "productDiscount": 10,        // Percentage (0-100)
  "productQuantity": 50,        // Available stock
  "soldQuantity": 25,           // Total sold
  "description": "High quality organic rice...",
  "imageUrl": "https://cloudinary.com/image.jpg",
  "status": "enabled|disabled",
  "createdAt": "2025-09-16T10:30:00.000Z",
  "updatedAt": "2025-09-16T10:30:00.000Z",
  "category": {
    "categoryId": "uuid-v4",
    "categoryName": "Cereals"
  },
  "avgRating": 4.5,            // Calculated from reviews
  "reviewCount": 23            // Total review count
}
```

### **Product Endpoints**

#### **GET `/api/products`** (Public)
```javascript
// Query Parameters (Optional)
?q=rice&categoryId=uuid&minPrice=10&maxPrice=50

// Success Response (200)
{
  "products": [
    {
      "productId": "uuid",
      "productName": "Organic Rice",
      "productPrice": 20.99,
      "productDiscount": 10,
      "productQuantity": 50,
      "soldQuantity": 25,
      "description": "High quality organic rice...",
      "imageUrl": "image-url",
      "categoryId": "uuid",
      "status": "enabled",
      "createdAt": "2025-09-16T10:30:00.000Z",
      "updatedAt": "2025-09-16T10:30:00.000Z"
    }
  ]
}
```

#### **GET `/api/products/summaries`** (Public - Optimized)
```javascript
// Lightweight product list for catalogs/listings with ratings
// Success Response (200)
{
  "products": [
    {
      "productId": "uuid",
      "productName": "Organic Rice",
      "productPrice": 15.99,
      "productDiscount": 10,
      "imageUrl": "image-url",
      "categoryId": "uuid",
      "avgRating": 4.5,        // Calculated from published reviews
      "reviewCount": 23,       // Count of published reviews
      "createdAt": "2025-09-16T10:30:00.000Z",
      "updatedAt": "2025-09-16T10:30:00.000Z"
    }
  ]
}
```

#### **GET `/api/products/:id`** (Public)
```javascript
// Success Response (200)
{
  "product": {
    "productId": "uuid",
    "productName": "Organic Rice",
    "categoryId": "uuid",
    "productPrice": 15.99,
    "productDiscount": 10,
    "productQuantity": 50,
    "soldQuantity": 25,
    "description": "Detailed description...",
    "imageUrl": "image-url",
    "status": "enabled",
    "createdAt": "2025-09-16T10:30:00.000Z",
    "updatedAt": "2025-09-16T10:30:00.000Z"
  }
}

// Error Response (404)
{
  "message": "not found"
}
```

#### **POST `/api/products`** (Admin Only)
```javascript
// Headers: Authorization: Bearer <admin-token>
// Content-Type: multipart/form-data

// Form Data
{
  "productName": "New Product",
  "categoryId": "uuid-v4",
  "productPrice": 25.99,
  "productDiscount": 0,
  "productQuantity": 100,
  "description": "Product description",
  "image": File // Optional image upload
}

// Success Response (201)
{
  "message": "created",
  "product": {
    "productId": "new-uuid",
    "productName": "New Product",
    // ... other fields
  }
}
```

---

## 📂 **Category Management**

### **Category Schema**
```javascript
// Category Object
{
  "categoryId": "uuid-v4",
  "categoryName": "Cereals",
  "createdAt": "2025-09-16T10:30:00.000Z",
  "updatedAt": "2025-09-16T10:30:00.000Z"
}
```

### **Category Endpoints**

#### **GET `/api/categories`** (Public)
```javascript
// Success Response (200)
{
  "success": true,
  "categories": [
    {
      "categoryId": "uuid",
      "categoryName": "Cereals",
      "createdAt": "2025-09-16T10:30:00.000Z",
      "updatedAt": "2025-09-16T10:30:00.000Z"
    }
  ]
}
```

#### **POST `/api/categories`** (Admin Only)

```javascript
// Headers: Authorization: Bearer <admin-token>
// Content-Type: multipart/form-data
// Body: { categoryName: string, image?: File }
// Success: 201 { message: "created", category: { ... } }
```

#### **PUT `/api/categories/:id`** (Admin Only)

```javascript
// Headers: Authorization: Bearer <admin-token>
// Content-Type: multipart/form-data
// Body: partial update fields, image?: File
// Success: 200 { message: "updated", category: { ... } }
```

#### **DELETE `/api/categories/:id`** (Admin Only)

```javascript
// Headers: Authorization: Bearer <admin-token>
// Success: 200 { message: "deleted" }
```

Note: Categories are available under both `/api/categories` and `/api/product-categories` for compatibility.

---

## 🛒 **Shopping Cart System**

### **Cart Schema**
```javascript
// Cart Object Structure
{
  "userId": "uuid-v4",
  "items": [
    {
      "productId": "uuid-v4",
      "quantity": 2,
      "price": 15.99        // Computed with discount
    }
  ],
  "total": 31.98,           // Items subtotal
  "appliedDiscount": {      // Optional applied coupon
    "id": "coupon-uuid",
    "code": "SAVE10",
    "type": "percent",      // "percent" | "fixed"
    "value": 10
  },
  "taxRate": 0.18,          // 18% tax rate
  "shipping": 5.00,         // Shipping cost
  "createdAt": "2025-09-16T10:30:00.000Z",
  "updatedAt": "2025-09-16T10:30:00.000Z"
}
```

### **Cart Endpoints**

#### **GET `/api/cart/:userId`** (Protected + Ownership)
```javascript
// Headers: Authorization: Bearer <token>
// URL: /api/cart/uuid-of-user

// Success Response (200)
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 15.99
    }
  ],
  "subtotal": 31.98,
  "tax": 5.76,             // Calculated: subtotal * taxRate
  "shipping": 5.00,
  "discount": 3.20,        // Applied discount amount
  "total": 39.54,          // Final total
  "appliedDiscount": {
    "code": "SAVE10",
    "type": "percent",
    "value": 10
  }
}
```

#### **POST `/api/cart/add`** (Protected + Ownership)
```javascript
// Request Body
{
  "userId": "uuid-v4",      // Must match token userId
  "productId": "uuid-v4",   // Valid product UUID
  "quantity": 2             // 1-99 range
}

// Success Response (201)
{
  "success": true,
  "message": "Item added to cart",
  "item": {
    "productId": "uuid",
    "quantity": 2,
    "price": 15.99
  }
}

// Error Response (400) - Validation
{
  "error": "Validation failed",
  "message": "Invalid input data provided",
  "details": [
    {
      "field": "quantity",
      "message": "Quantity must be between 1 and 99",
      "value": 0
    }
  ],
  "statusCode": 400
}
```

#### **PUT `/api/cart/update`** (Protected + Ownership)
```javascript
// Request Body
{
  "userId": "uuid-v4",
  "productId": "uuid-v4",
  "quantity": 3             // 0-99 (0 removes item)
}

// Success Response (200)
{
  "success": true,
  "message": "Cart updated successfully"
}
```

#### **POST `/api/cart/clear`** (Protected + Ownership)
```javascript
// Request Body
{
  "userId": "uuid-v4"
}

// Success Response (200)
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

---

## ❤️ **Wishlist System**

### **Wishlist Schema**
```javascript
// Wishlist Item Object
{
  "id": "uuid-v4",
  "userId": "uuid-v4",
  "productId": "uuid-v4",
  "createdAt": "2025-09-16T10:30:00.000Z",
  "updatedAt": "2025-09-16T10:30:00.000Z"
}
```

### **Wishlist Endpoints**

#### **GET `/api/wishlist/:userId`** (Protected + Ownership)
```javascript
// Headers: Authorization: Bearer <token>
// URL: /api/wishlist/uuid-of-user

// Success Response (200)
{
  "success": true,
  "message": "Wishlist retrieved successfully",
  "count": 5,
  "items": [
    {
      "id": "uuid",
      "userId": "uuid",
      "productId": "uuid",
      "createdAt": "2025-09-16T10:30:00.000Z",
      "updatedAt": "2025-09-16T10:30:00.000Z"
    }
  ]
}
```

#### **POST `/api/wishlist/add`** (Protected)
```javascript
// Request Body
{
  "productId": "uuid-v4"    // Valid product UUID
}

// Success Response (201)
{
  "success": true,
  "message": "Added to wishlist successfully",
  "item": {
    "id": "uuid",
    "userId": "uuid",
    "productId": "uuid",
    "createdAt": "2025-09-16T10:30:00.000Z",
    "updatedAt": "2025-09-16T10:30:00.000Z"
  }
}

// Response (200) - Already exists
{
  "success": true,
  "message": "Product already in wishlist",
  "item": { /* existing item */ }
}
```

#### **POST `/api/wishlist/remove`** (Protected)
```javascript
// Request Body
{
  "productId": "uuid-v4"
}

// Success Response (200)
{
  "success": true,
  "message": "Product removed from wishlist successfully"
}

// Error Response (404)
{
  "error": "Not found",
  "message": "Product not found in wishlist",
  "statusCode": 404
}
```

---

## 📦 **Order Management**

### **Order Schema**
```javascript
// Order Object Structure
{
  "orderId": "uuid-v4",
  "userId": "uuid-v4",
  "items": [
    {
      "productId": "uuid-v4",
      "productName": "Organic Rice",
      "quantity": 2,
      "unitPrice": 15.99,
      "lineTotal": 31.98
    }
  ],
  "total": 31.98,           // Items subtotal
  "totalAmount": 39.54,     // Final amount (with tax, shipping, discounts)
  "status": "pending|completed|cancelled",
  "createdAt": "2025-09-16T10:30:00.000Z",
  "updatedAt": "2025-09-16T10:30:00.000Z"
}
```

### **Order Endpoints**

#### **POST `/api/orders`** (Protected)
```javascript
// Headers: Authorization: Bearer <token>

// Request Body
{
  "items": [
    {
      "productId": "uuid-v4",
      "quantity": 2
    }
  ],
  "shippingAddress": "123 Main St, City, State",
  "paymentMethod": "card|cash|bank_transfer"
}

// Success Response (201)
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "orderId": "uuid",
    "userId": "uuid",
    "items": [/* order items */],
    "total": 31.98,
    "totalAmount": 39.54,
    "status": "pending",
    "createdAt": "2025-09-16T10:30:00.000Z"
  }
}
```

#### **GET `/api/orders/:id`** (Protected)
```javascript
// Success Response (200)
{
  "success": true,
  "order": {
    "orderId": "uuid",
    "userId": "uuid",
    "items": [/* order items */],
    "total": 31.98,
    "totalAmount": 39.54,
    "status": "completed",
    "createdAt": "2025-09-16T10:30:00.000Z",
    "updatedAt": "2025-09-16T10:30:00.000Z"
  }
}
```

---

## 🛍️ **Checkout Process**

### **Checkout Endpoint**

#### **POST `/api/checkout`** (Protected)
```javascript
// Headers: Authorization: Bearer <token>

// Request Body (Optional)
{
  "initiatePayment": true   // Query param: ?initiatePayment=true
}

// Success Response (200)
{
  "success": true,
  "message": "Checkout completed successfully",
  "order": {
    "orderId": "uuid",
    "userId": "uuid",
    "items": [
      {
        "productId": "uuid",
        "productName": "Organic Rice",
        "quantity": 2,
        "unitPrice": 15.99,
        "lineTotal": 31.98
      }
    ],
    "total": 31.98,
    "totalAmount": 39.54,
    "status": "pending"
  },
  "inventoryUpdated": true,
  "cartCleared": true
}

// Error Response (400) - Empty Cart
{
  "error": "Invalid request",
  "message": "cart empty",
  "statusCode": 400
}

// Error Response (400) - Insufficient Stock
{
  "error": "Inventory error",
  "message": "insufficient stock for product Organic Rice",
  "statusCode": 400
}
```

### Extended Checkout Payload (Optional)

You can POST a JSON body including `customer`, `payment`, and `notes` to persist a sanitized snapshot on the order:

```jsonc
{
  "customer": {
    "fullName": "Alice Buyer",
    "email": "alice@example.com",
    "phone": "+9779812345678",
    "address": "Street, City",
    "mapAddress": "GeoRef"
  },
  "payment": {
    "method": "cod" | "card" | "wallet",
    "card": { /* when method = card */
      "cardNumber": "4111111111111111",
      "expiry": "12/30",
      "cvv": "123",
      "nameOnCard": "Alice Buyer"
    },
    "wallet": { /* when method = wallet */
      "provider": "esewa",
      "walletNumber": "9800000000",
      "passcode": "secret"
    }
  },
  "notes": "Leave at reception"
}
```

Persistence & Sanitization:
- `customerData` saved (strings truncated to safe lengths).
- `paymentMethod` saved.
- `paymentData` saved WITH ONLY: card `last4`, `expiry`, `nameOnCard` OR wallet `provider`, last 4 digits of `walletNumber`, or `{ method: 'cod' }`.
- Full `cardNumber`, `cvv`, wallet passcode are discarded server-side.
- `notes` truncated to 2000 chars.

Security Notice: Replace raw card/wallet data with gateway tokenization (future integration) for production.

---

### Payment Integration Fields (Gateway Readiness)

New columns added to `orders` table to support external payment gateway lifecycle tracking:

- `transactionRef` (string, nullable): Reference returned by payment gateway after initializing a transaction (charge/session ID). Populated post-init.
- `paymentStatus` (enum: `pending | initiated | completed | failed | refunded`):
  - `pending`: Order created; payment not started (COD or pre-init)
  - `initiated`: Gateway session created, awaiting confirmation/webhook
  - `completed`: Gateway confirmed success (capture/settlement)
  - `failed`: Irrecoverable payment failure
  - `refunded`: Funds returned (full/partial). Future: details recorded in `paymentData.refunds[]`.
- `paymentData` (JSON, sanitized): Only non-sensitive snapshot `{ last4, brand, expMonth, expYear, method, gateway, masked: true }`. No PAN/CVV stored.
- `customerData` (JSON): Non-sensitive buyer contact & address snapshot.
- `paymentMethod` (string): Canonical method key (`cod`, `card`, `wallet`, etc.).
- `notes` (TEXT): Buyer-provided optional instructions.

#### Redaction Policy

For non-admin users retrieving orders (`GET /api/orders` or `GET /api/orders/:id`):

```jsonc
{
  "paymentData": {
    "last4": "4242",
    "brand": "visa",
    "expMonth": 12,
    "expYear": 2030,
    "method": "card",
    "masked": true
  }
}
```

Admins (role = `admin`) receive the full stored `paymentData` object (still sanitized—raw secrets are never persisted).

#### Ownership Enforcement

Non-admin users are only allowed to list or retrieve their own orders regardless of query params. Attempting to access another user's order returns `403 forbidden`.

#### Updating Orders

Non-admin updates silently ignore payment lifecycle / totals fields: `paymentData`, `paymentStatus`, `transactionRef`, `total`, `totalAmount`.

#### Migration Script

Production should NOT rely on `sequelize.sync({ alter: true })` for these columns. Run the idempotent script:

```bash
pnpm run migrate:payment-fields
```

The script checks each column before adding it; safe to run multiple times.

#### Planned Next Steps

- Gateway webhook handler to transition `paymentStatus`.
- Tokenized client flow: send `paymentToken` instead of raw card/wallet data.
- Refund audit trail (`paymentData.refunds[]`).
- Immutable order event log for full lifecycle history.

---

## 💳 **Payment Integration**

### **Payment Endpoints**

Note: Base path is `/api/payments`.

#### **POST `/api/payments/esewa/validate`** (Protected)

```javascript
// Request Body
{
  "orderId": "uuid-v4",
  "amount": 39.54,
  "reference": "esewa-transaction-id"
}

// Success Response (200)
{
  "success": true,
  "message": "Payment validated successfully",
  "paymentStatus": "completed"
}
```

#### **POST `/api/payments/khalti/initiate`** (Protected)

```javascript
// Request Body
{
  "orderId": "uuid-v4",
  "amount": 3954,          // Amount in paisa (NPR)
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+9779841234567"
  }
}

// Success Response (200)
{
  "success": true,
  "paymentUrl": "https://khalti.com/payment/...",
  "token": "khalti-payment-token"
}
```

#### Webhooks (Public)

These endpoints are called by payment providers; they do not require authentication.

- `POST /api/payments/webhook/esewa`
- `POST /api/payments/webhook/khalti`

Respond with 200 OK per provider spec.

---

## ⭐ **Review System**

### **Review Schema**
```javascript
// Review Object
{
  "reviewId": "uuid-v4",
  "productId": "uuid-v4",
  "email": "reviewer@example.com",
  "message": "Great product quality!",
  "rating": 4.5,           // 1.0 - 5.0
  "status": "published|pending|rejected",
  "createdAt": "2025-09-16T10:30:00.000Z",
  "updatedAt": "2025-09-16T10:30:00.000Z"
}
```

### **Review Endpoints**

#### **POST `/api/reviews`** (Public)
```javascript
// Request Body
{
  "productId": "uuid-v4",
  "email": "reviewer@example.com",
  "message": "Excellent product quality and fast delivery!",
  "rating": 5
}

// Success Response (201)
{
  "success": true,
  "message": "Review submitted successfully",
  "review": {
    "reviewId": "uuid",
    "productId": "uuid",
    "email": "reviewer@example.com",
    "message": "Excellent product...",
    "rating": 5,
    "status": "published"
  }
}
```

#### **GET `/api/reviews`** (Public)
```javascript
// Query Parameters
?status=published&productId=uuid&limit=10&page=1

// Success Response (200)
{
  "success": true,
  "reviews": [
    {
      "reviewId": "uuid",
      "productId": "uuid",
      "email": "reviewer@example.com",
      "message": "Great product!",
      "rating": 5,
      "status": "published",
      "createdAt": "2025-09-16T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

---

## 🎫 **Coupon System**

### **Coupon Schema**
```javascript
// Coupon Object
{
  "couponId": "uuid-v4",
  "code": "SAVE10",
  "discountType": "percent|fixed",
  "value": 10,              // Percentage or fixed amount
  "maxUses": 100,           // Maximum usage limit
  "usedCount": 25,          // Current usage count
  "startsAt": "2025-09-15T00:00:00.000Z",
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "status": "active|inactive",
  "minOrderAmount": 50.00,  // Minimum order for coupon
  "metadata": {},           // Additional coupon data
  "createdAt": "2025-09-16T10:30:00.000Z",
  "updatedAt": "2025-09-16T10:30:00.000Z"
}
```

### **Coupon Endpoints**

#### **GET `/api/coupons/public/active`** (Public)
```javascript
// Query Parameters
?limit=10

// Success Response (200)
{
  "success": true,
  "coupons": [
    {
      "couponId": "uuid",
      "code": "SAVE10",
      "discountType": "percent",
      "value": 10,
      "minOrderAmount": 50.00,
      "expiresAt": "2025-12-31T23:59:59.000Z"
    }
  ]
}
```

#### **POST `/api/coupons/validate`** (Protected)
```javascript
// Request Body
{
  "code": "SAVE10",
  "orderAmount": 75.50
}

// Success Response (200)
{
  "success": true,
  "valid": true,
  "coupon": {
    "couponId": "uuid",
    "code": "SAVE10",
    "discountType": "percent",
    "value": 10,
    "discountAmount": 7.55  // Calculated discount
  }
}

// Error Response (400) - Invalid/Expired
{
  "error": "Invalid coupon",
  "message": "Coupon has expired or reached usage limit",
  "statusCode": 400
}
```

---

## 🎁 **Gift Code System** (Protected - Auth Required)

### **POST `/api/giftcode/apply`** (Protected)
```javascript
// Request Body
{
  "code": "SAVE10"
}

// Success Response (200)
{
  "ok": true,
  "items": [/* cart items */],
  "subtotal": 31.98,
  "taxRate": 0.18,
  "tax": 5.76,
  "shipping": 5.00,
  "discount": {
    "type": "percent",
    "value": 10,
    "code": "SAVE10"
  },
  "discountAmount": 3.20,
  "total": 39.54
}

// Error Response (400)
{
  "message": "invalid"
}
```

### **DELETE `/api/giftcode/remove`** (Protected)
```javascript
// Success Response (200)
{
  "ok": true,
  "items": [/* cart items */],
  "subtotal": 31.98,
  "taxRate": 0.18,
  "tax": 5.76,
  "shipping": 5.00,
  "discount": null,
  "discountAmount": 0,
  "total": 42.74
}
```

---

## 📄 **Order Transcript System** (Protected - Auth Required)

### **POST `/api/transcripts/generate`** (Protected)
```javascript
// Request Body
{
  "orderId": "uuid-v4"
}

// Success Response (201)
{
  "message": "Transcript generated successfully",
  "transcriptId": "uuid",
  "downloadUrl": "/api/transcripts/uuid/download"
}
```

### **GET `/api/transcripts/:id`** (Protected)
```javascript
// Success Response (200)
{
  "transcriptId": "uuid",
  "orderId": "uuid",
  "userId": "uuid",
  "filePath": "/uploads/transcripts/order-uuid.pdf",
  "createdAt": "2025-09-16T10:30:00.000Z"
}
```

### **GET `/api/transcripts/:id/download`** (Protected)
```javascript
// Returns PDF file download
// Content-Type: application/pdf
// Content-Disposition: attachment; filename="order-transcript.pdf"
```

---

## 📞 **Contact System**

#### **POST `/api/contact`** (Public)
```javascript
// Request Body
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I have a question about your organic rice products."
}

// Success Response (201)
{
  "success": true,
  "message": "Contact form submitted successfully",
  "contactId": "uuid"
}
```

---

## 🏠 **Dashboard Analytics** (Admin Only)

#### **GET `/api/dashboard`** (Admin Protected)
```javascript
// Headers: Authorization: Bearer <admin-token>

// Success Response (200)
{
  "totalUsers": 1250,
  "totalProducts": 89,
  "totalOrders": 456,
  "totalRevenue": 15678.90,
  "topProducts": [
    {
      "productId": "uuid",
      "productName": "Organic Rice",
      "soldQuantity": 125,
      "productPrice": 15.99,
      "imageUrl": "image-url"
    }
  ],
  "recentOrders": [
    {
      "orderId": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "totalAmount": 45.67,
      "status": "completed",
      "createdAt": "2025-09-16T10:30:00.000Z"
    }
  ]
}
```

---

## 🔒 **Security & Middleware**

### **Rate Limiting** (Configurable)
```javascript
// Rate limit headers per RFC (standardHeaders=true)
{
  "RateLimit-Limit": "5",
  "RateLimit-Remaining": "4",
  "RateLimit-Reset": "900"
}

// Rate Limit Exceeded (429)
{
  "error": "Too many authentication attempts",
  "message": "Please try again after 15 minutes",  // Uses AUTH_RATE_LIMIT_WINDOW_MINUTES
  "statusCode": 429
}
```

### **Authentication Rates**
- **Auth endpoints**: Configurable via `AUTH_RATE_LIMIT_MAX_REQUESTS` per `AUTH_RATE_LIMIT_WINDOW_MINUTES` (default: 5 requests per 15 minutes)
- **General endpoints**: 100 requests per 15 minutes
- **File uploads**: Limited to 5MB per request

### **Input Validation**
- **UUIDs**: Must be valid v4 format
- **Emails**: RFC compliant email validation
- **Passwords**: 8+ chars, uppercase, lowercase, number, special character
- **Quantities**: 1-99 range for cart items
- **Phone numbers**: International format validation

### **Error Response Format**
```javascript
// Standardized Error Structure
{
  "error": "Error Type",
  "message": "Human readable message",
  "statusCode": 400,
  "timestamp": "2025-09-16T10:30:00.000Z",
  "path": "/api/endpoint",
  "method": "POST",
  "details": [/* validation errors */] // Optional
}
```

---

## 📁 **File Upload System**

### **Upload Endpoints**
- **Products**: `POST /api/products` (multipart/form-data)
- **User Profile**: `PUT /api/users/:id/image` (multipart/form-data)
- **Categories**: `POST /api/categories` (multipart/form-data)

### **Upload Specifications**
```javascript
// Multer Configuration
{
  "maxFileSize": "5MB",
  "allowedTypes": ["image/jpeg", "image/png", "image/webp"],
  "fieldName": "image",
  "storage": "cloudinary" // or local storage
}

// Upload Response
{
  "success": true,
  "message": "File uploaded successfully",
  "imageUrl": "https://cloudinary.com/image.jpg"
}
```

---

## 🌐 **CORS Configuration**

### **Allowed Origins**
```javascript
// Development
["http://localhost:3000", "http://localhost:3001"]

// Production
[process.env.FRONTEND_URL]

// Allowed Methods
["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]

// Allowed Headers
["Content-Type", "Authorization", "x-api-key"]
```

---

## 🗄️ **Database Schema Reference**

### **User Table**
```sql
CREATE TABLE users (
  userId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phoneNumber VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  mapAddress VARCHAR(255), -- Google Maps link
  imageUrl VARCHAR(255),
  bankAccountNumber VARCHAR(255),
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
  role VARCHAR(255) DEFAULT 'user',
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### **Product Table**
```sql
CREATE TABLE products (
  productId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  productName VARCHAR(255) NOT NULL,
  categoryId UUID NOT NULL REFERENCES product_categories(categoryId),
  productPrice FLOAT NOT NULL,
  productDiscount FLOAT DEFAULT 0,
  productQuantity INTEGER DEFAULT 0,
  soldQuantity INTEGER DEFAULT 0,
  description TEXT,
  imageUrl VARCHAR(255),
  status VARCHAR(255) DEFAULT 'enabled',
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### **Cart Table**
```sql
CREATE TABLE carts (
  userId UUID PRIMARY KEY REFERENCES users(userId) ON DELETE CASCADE,
  items JSON NOT NULL DEFAULT '[]',
  total FLOAT DEFAULT 0,
  appliedDiscount JSON,
  taxRate FLOAT DEFAULT 0.18,
  shipping FLOAT DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### **Wishlist Table**
```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(userId) ON DELETE CASCADE,
  productId UUID NOT NULL REFERENCES products(productId) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(userId, productId) -- Prevent duplicates
);
```

### **Order Table**
```sql
CREATE TABLE orders (
  orderId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(userId),
  items JSON NOT NULL DEFAULT '[]',
  total FLOAT DEFAULT 0,
  totalAmount FLOAT DEFAULT 0,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL
);
```

---

## 🧪 **Testing & Development**

### **Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=15d

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
CONTACT_EMAIL=codingwithjiwan@gmail.com

# Frontend
FRONTEND_URL=https://yourdomain.com

# File Upload (Cloudinary - Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Configuration
NODE_ENV=development
PORT=5000

# Security
BCRYPT_SALT=10
FORGOT_PIN_TTL_MINUTES=15

# Rate Limiting
AUTH_RATE_LIMIT_WINDOW_MINUTES=15
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Optional: API Key for additional security
API_KEY=your_optional_api_key
```

### **Testing Endpoints**
```javascript
// Health Check (if implemented)
GET /api/health

// Response
{
  "status": "healthy",
  "timestamp": "2025-09-16T10:30:00.000Z",
  "database": "connected"
}
```

### **Development Commands**
```bash
# Install dependencies
pnpm install

# Run development server (with nodemon)
pnpm start

# Seed database with sample data
pnpm seed:categories    # Seed product categories
pnpm seed:users         # Seed sample users
pnpm seed:products      # Seed sample products
pnpm seed:reviews       # Seed sample reviews

# Database utilities
pnpm check:users        # Check existing users

# Testing
pnpm test               # Run tests
pnpm test:rate-limit    # Demonstrate configurable auth rate limiting
```

---

## 🚨 **Error Handling Guide**

### **HTTP Status Codes**
- **200**: Success
- **201**: Created (successful registration, order creation)
- **400**: Bad Request (validation errors, invalid data)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions, ownership violation)
- **404**: Not Found (resource doesn't exist)
- **409**: Conflict (duplicate email, username taken)
- **413**: Payload Too Large (file size exceeded)
- **422**: Unprocessable Entity (business logic errors)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

### **Frontend Error Handling**
```javascript
// Example error handling in frontend
try {
  const response = await api.post('/api/cart/add', {
    userId: user.userId,
    productId: product.productId,
    quantity: 2
  });

  if (response.status === 201) {
    showSuccess('Item added to cart!');
  }
} catch (error) {
  if (error.response?.status === 400) {
    // Handle validation errors
    const details = error.response.data.details;
    showValidationErrors(details);
  } else if (error.response?.status === 401) {
    // Redirect to login
    redirectToLogin();
  } else if (error.response?.status === 429) {
    // Show rate limit message
    showError('Too many requests. Please try again later.');
  } else {
    // Generic error
    showError('Something went wrong. Please try again.');
  }
}
```

---

## 📝 **Integration Examples**

### **User Authentication Flow**
```javascript
// 1. Registration
const registerUser = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data.user;
};

// 2. Login
const loginUser = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data.user;
};

// 3. Get Profile
const getProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await api.get('/api/auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.user;
};
```

### **Shopping Cart Integration**
```javascript
// Cart management class
class CartManager {
  constructor(apiClient, userId) {
    this.api = apiClient;
    this.userId = userId;
  }

  async getCart() {
    const response = await this.api.get(`/api/cart/${this.userId}`);
    return response.data;
  }

  async addItem(productId, quantity = 1) {
    const response = await this.api.post('/api/cart/add', {
      userId: this.userId,
      productId,
      quantity
    });
    return response.data;
  }

  async updateItem(productId, quantity) {
    const response = await this.api.put('/api/cart/update', {
      userId: this.userId,
      productId,
      quantity
    });
    return response.data;
  }

  async clearCart() {
    const response = await this.api.post('/api/cart/clear', {
      userId: this.userId
    });
    return response.data;
  }
}
```

### **Product Catalog Integration**
```javascript
// Product service
class ProductService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await this.api.get(`/api/products?${params}`);
    return response.data;
  }

  async getProductSummaries() {
    const response = await this.api.get('/api/products/summaries');
    return response.data;
  }

  async getProductById(productId) {
    const response = await this.api.get(`/api/products/${productId}`);
    return response.data.product;
  }

  async searchProducts(query, filters = {}) {
    const params = new URLSearchParams({ search: query, ...filters });
    const response = await this.api.get(`/api/products?${params}`);
    return response.data;
  }
}
```

---

## 🎯 **Best Practices for Frontend Integration**

### **1. API Client Setup**
```javascript
// axios configuration
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Default PORT=5000
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### **2. State Management**
```javascript
// Redux/Context setup for user state
const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: false
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    }
  }
});
```

### **3. Form Validation**
```javascript
// Validation schema matching backend requirements
const registerSchema = yup.object({
  name: yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number and special character')
    .required('Password is required'),
  phone: yup.string()
    .matches(/^\+?[\d\s-()]+$/, 'Invalid phone number')
});
```

### **4. Error Boundary Component**
```javascript
// React error boundary for API errors
class APIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('API Error:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please refresh the page or try again later.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 🔧 **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **1. CORS Errors**
```javascript
// Ensure frontend origin is in allowed origins
// Add to server CORS config if needed
const allowedOrigins = [
  "http://localhost:3000",  // React dev server
  "http://localhost:3001",  // Alternative port
  process.env.FRONTEND_URL  // Production URL
];
```

#### **2. Authentication Issues**
```javascript
// Check token format
const token = localStorage.getItem('token');
if (!token || token.split('.').length !== 3) {
  // Invalid JWT format
  localStorage.removeItem('token');
  redirectToLogin();
}

// Check token expiration
const payload = JSON.parse(atob(token.split('.')[1]));
if (payload.exp * 1000 < Date.now()) {
  // Token expired
  localStorage.removeItem('token');
  redirectToLogin();
}
```

#### **3. Rate Limiting**
```javascript
// Implement exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};
```

---

This documentation provides a complete reference for integrating with the e-commerce backend API. Keep this guide updated as new endpoints and features are added to the system.

---

**Last Updated**: September 16, 2025
**API Version**: 1.0
**Backend Framework**: Express.js + TypeScript + PostgreSQL + Sequelize
