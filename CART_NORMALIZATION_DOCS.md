# Normalized Cart System Documentation

## Overview

The cart system has been normalized from a JSON-based approach to a proper relational database structure with separate `carts` and `cart_items` tables. This provides better data integrity, performance, and maintainability.

## Database Schema

### Carts Table (`carts`)
```sql
CREATE TABLE carts (
  "cartId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users("userId") ON DELETE CASCADE,
  "appliedDiscount" JSONB DEFAULT NULL,
  "taxRate" FLOAT DEFAULT 0.13,
  "shipping" FLOAT DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId")
);
```

### Cart Items Table (`cart_items`)
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cartId" UUID NOT NULL REFERENCES carts("cartId") ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES products("productId") ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 99),
  price FLOAT NOT NULL CHECK (price >= 0),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("cartId", "productId")
);
```

## Model Definitions

### Cart Model (`cartModel.ts`)
```typescript
interface CartAttributes {
  cartId: string;
  userId: string;
  appliedDiscount?: AppliedDiscount | null;
  taxRate?: number;
  shipping?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Cart extends Model<CartAttributes, CartCreationAttributes> {
  declare cartId: string;
  declare userId: string;
  declare appliedDiscount: AppliedDiscount | null;
  declare taxRate: number;
  declare shipping: number;
  declare readonly items?: CartItem[]; // Association
}
```

### CartItem Model (`cartItemModel.ts`)
```typescript
interface CartItemAttributes {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> {
  declare id: string;
  declare cartId: string;
  declare productId: string;
  declare quantity: number;
  declare price: number;
  declare readonly cart?: Cart; // Association
  declare readonly product?: Product; // Association
}
```

## Associations

```typescript
// One cart has many items
Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items", onDelete: "CASCADE" });
CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });

// Each cart item references a product
Product.hasMany(CartItem, { foreignKey: "productId", as: "cartItems" });
CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

// User has one cart
User.hasOne(Cart, { foreignKey: "userId", as: "cart" });
Cart.belongsTo(User, { foreignKey: "userId", as: "user" });
```

## API Endpoints

### GET `/api/cart/:userId`
Returns cart with items and calculated totals.

**Response Format:**
```json
{
  "cartId": "uuid",
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "subtotal": 199.98,
  "taxRate": 0.13,
  "tax": 25.997,
  "shipping": 0,
  "discount": null,
  "total": 225.977
}
```

### POST `/api/cart/add`
Adds item to cart or updates quantity if item already exists.

**Request Body:**
```json
{
  "userId": "uuid",
  "productId": "uuid",
  "quantity": 1
}
```

### PUT `/api/cart/update`
Updates item quantity or removes item if quantity is 0.

**Request Body:**
```json
{
  "userId": "uuid",
  "productId": "uuid",
  "quantity": 3
}
```

### DELETE `/api/cart/remove`
Removes specific item from cart.

**Request Body:**
```json
{
  "userId": "uuid",
  "productId": "uuid"
}
```

### POST `/api/cart/clear`
Removes all items from cart.

**Request Body:**
```json
{
  "userId": "uuid"
}
```

### POST `/api/cart/sync`
Replaces entire cart contents with provided items.

**Request Body:**
```json
{
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ]
}
```

## Controller Implementation

### Key Features
- **Normalized Data Access**: Uses proper Sequelize associations
- **Price Calculation**: Automatically computes discounted prices
- **Authorization**: Validates user ownership of cart operations
- **Error Handling**: Comprehensive error checking and logging
- **Performance**: Efficient queries with includes and joins
- **Data Integrity**: Validates quantities, prevents duplicates

### Helper Functions
```typescript
// Calculate item price with discount
const computeItemPrice = (product: any): number => {
  const base = Number(getVal(product, "productPrice")) || 0;
  let discount = Number(getVal(product, "productDiscount")) || 0;
  discount = Math.min(Math.max(discount, 0), 100);
  const price = base - (base * discount) / 100;
  return isNaN(price) ? 0 : parseFloat(price.toFixed(2));
};

// Calculate cart totals
const calculateCartTotals = (items: any[], cart: any) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = typeof cart.taxRate === "number" ? cart.taxRate : 0.13;
  const shipping = typeof cart.shipping === "number" ? cart.shipping : 0;

  // Apply discounts, calculate tax, return totals
  // ...
};
```

## Migration Process

### Running the Migration
```bash
# Navigate to server directory
cd server

# Run migration script
npx ts-node scripts/migrateCartNormalization.ts
```

### Migration Steps
1. **Creates `cart_items` table** with proper constraints and indexes
2. **Migrates existing data** from JSON `items` field to normalized table
3. **Removes old columns** (`items`, `total`) from `carts` table
4. **Verifies migration** success with count checks

### Rollback (Development Only)
```typescript
import { rollbackCartMigration } from './scripts/migrateCartNormalization';
await rollbackCartMigration();
```

## Testing

### Running Tests
```bash
# Run cart functionality tests
npx ts-node scripts/testNormalizedCart.ts
```

### Test Coverage
- ✅ Cart creation and item addition
- ✅ Item quantity updates
- ✅ Item removal
- ✅ Cart clearing
- ✅ Total calculations
- ✅ Unique constraints
- ✅ Data integrity

## Performance Considerations

### Indexes
- Primary keys on both tables for fast lookups
- Foreign key indexes for joins
- Unique constraint on `(cartId, productId)` prevents duplicates
- Composite index on cart operations

### Query Optimization
- Uses Sequelize `include` for efficient joins
- Batches operations where possible
- Minimal data transfer with specific field selection
- Proper transaction handling for data consistency

## Security Features

### Authorization
- User ownership validation for all operations
- Token-based authentication required
- Cross-user access prevention

### Rate Limiting
- Read operations: 300 requests/minute
- Write operations: 100 requests/minute
- Request size limits: 5MB max

### Input Validation
- UUID validation for IDs
- Quantity limits (1-99)
- Price validation (non-negative)
- SQL injection prevention via parameterized queries

## Error Handling

### Common Error Responses
```json
// Unauthorized access
{
  "message": "Unauthorized",
  "statusCode": 401
}

// Product not found
{
  "message": "Product not found",
  "statusCode": 404
}

// Cart item not found
{
  "message": "Item not found in cart",
  "statusCode": 404
}

// Server error
{
  "message": "Server error",
  "statusCode": 500
}
```

### Logging
- All operations logged with user ID and action
- Error stack traces in development
- Performance metrics for optimization

## Best Practices

### Frontend Integration
```typescript
// Always handle loading states
const [isLoading, setIsLoading] = useState(false);

// Optimistic updates with rollback
const optimisticUpdate = (newState) => {
  setCartState(newState);
  api.updateCart(newState).catch(() => {
    // Rollback on error
    setCartState(previousState);
  });
};

// Debounce rapid operations
const debouncedUpdate = debounce(updateCartItem, 300);
```

### Backend Best Practices
- Always use transactions for multi-table operations
- Validate input at controller level
- Return consistent response formats
- Log important operations for debugging
- Handle edge cases gracefully

## Troubleshooting

### Common Issues
1. **Migration fails**: Check database permissions and existing data
2. **Duplicate key errors**: Ensure unique constraint on `(cartId, productId)`
3. **Performance issues**: Check index usage with `EXPLAIN` queries
4. **Data inconsistency**: Verify foreign key constraints are enabled

### Debug Commands
```sql
-- Check cart items for user
SELECT c."cartId", ci."productId", ci.quantity, ci.price
FROM carts c
LEFT JOIN cart_items ci ON c."cartId" = ci."cartId"
WHERE c."userId" = 'user-id';

-- Verify constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'cart_items';
```

## Future Enhancements

### Planned Features
- [ ] Cart sharing between users
- [ ] Save for later functionality
- [ ] Cart persistence across sessions
- [ ] Bulk operations API
- [ ] Cart history tracking
- [ ] Real-time cart synchronization

### Performance Optimizations
- [ ] Redis caching for frequent reads
- [ ] Background price updates
- [ ] Bulk insert optimizations
- [ ] Connection pooling tuning
