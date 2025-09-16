import { connectDB } from "../database/connection";
import Cart from "../database/models/cartModel";
import Product from "../database/models/productModel";

// Simulate cart controller functions for testing
const getVal = (obj: any, key: string) => (obj && typeof obj.get === 'function') ? obj.get(key) : obj?.[key];

const computeItemPrice = (product: any) => {
  const base = Number(getVal(product, 'productPrice')) || 0;
  let discount = Number(getVal(product, 'productDiscount')) || 0;
  discount = Math.min(Math.max(discount, 0), 100);
  const price = base - (base * discount) / 100;
  return isNaN(price) ? 0 : parseFloat(price.toFixed(2));
};

const calcSummary = (cart: any) => {
  const items = Array.isArray(cart.items) ? cart.items : [];
  const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);
  const taxRate = typeof cart.taxRate === "number" ? cart.taxRate : 0.18;
  const shipping = typeof cart.shipping === "number" ? cart.shipping : 0;

  let discountAmount = 0;
  const applied = cart.appliedDiscount;
  if (applied) {
    if (applied.type === "percent") discountAmount = (subtotal * applied.value) / 100;
    else discountAmount = applied.value;
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const taxable = Math.max(0, subtotal - discountAmount);
  const tax = parseFloat((taxable * taxRate).toFixed(2));
  const total = parseFloat((taxable + tax + shipping).toFixed(2));

  cart.total = total;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxRate,
    tax,
    shipping,
    discount: applied ? { type: applied.type, value: applied.value, code: applied.code } : null,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    total,
  };
};

async function testAdvancedCart() {
  try {
    await connectDB();
    console.log('🛒 Testing Advanced Cart Features...\n');

    // Get some products for testing
    console.log('📦 Fetching available products...');
    const products = await (Product as any).findAll({ limit: 5 });
    console.log(`Found ${products.length} products\n`);

    if (products.length < 2) {
      console.log('❌ Need at least 2 products for testing. Run product seeding first.');
      return;
    }

    const testUserId = 'f469c1fd-9ca2-4bfc-adae-45c1a12bbc9a';

    // Clear any existing cart
    await Cart.destroy({ where: { userId: testUserId } });
    console.log('🗑️  Cleared existing cart\n');

    // Test 1: Add multiple items
    console.log('🔥 Test 1: Adding multiple items');
    const product1 = products[0];
    const product2 = products[1];

    console.log(`Adding product 1: ${getVal(product1, 'productName')} - $${getVal(product1, 'productPrice')}`);
    console.log(`Adding product 2: ${getVal(product2, 'productName')} - $${getVal(product2, 'productPrice')}\n`);

    let cart = await Cart.create({
      userId: testUserId,
      items: [
        {
          productId: getVal(product1, 'productId'),
          quantity: 2,
          price: computeItemPrice(product1)
        },
        {
          productId: getVal(product2, 'productId'),
          quantity: 1,
          price: computeItemPrice(product2)
        }
      ],
      taxRate: 0.18,
      shipping: 5.99
    });

    let summary = calcSummary(cart);
    await cart.save();

    console.log('✅ Multiple items added:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('');

    // Test 2: Apply percentage discount coupon
    console.log('🎟️  Test 2: Applying 15% discount coupon');
    (cart as any).appliedDiscount = {
      code: 'SAVE15',
      type: 'percent',
      value: 15
    };

    summary = calcSummary(cart);
    await cart.save();

    console.log('✅ 15% discount applied:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('');

    // Test 3: Apply fixed amount discount
    console.log('💰 Test 3: Switching to $10 fixed discount');
    (cart as any).appliedDiscount = {
      code: 'SAVE10',
      type: 'fixed',
      value: 10
    };

    summary = calcSummary(cart);
    await cart.save();

    console.log('✅ $10 fixed discount applied:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('');

    // Test 4: Add more items to existing cart
    console.log('➕ Test 4: Adding third product to cart');
    if (products.length >= 3) {
      const product3 = products[2];
      const currentItems = (cart as any).items || [];
      currentItems.push({
        productId: getVal(product3, 'productId'),
        quantity: 3,
        price: computeItemPrice(product3)
      });

      (cart as any).items = currentItems;
      console.log(`Added: ${getVal(product3, 'productName')} x3 - $${computeItemPrice(product3)} each`);

      summary = calcSummary(cart);
      await cart.save();

      console.log('✅ Third product added:');
      console.log(JSON.stringify(summary, null, 2));
      console.log('');
    }

    // Test 5: High tax rate
    console.log('📊 Test 5: Testing with higher tax rate (25%)');
    (cart as any).taxRate = 0.25;

    summary = calcSummary(cart);
    await cart.save();

    console.log('✅ Higher tax rate applied:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('');

    // Test 6: Free shipping
    console.log('🚚 Test 6: Applying free shipping');
    (cart as any).shipping = 0;

    summary = calcSummary(cart);
    await cart.save();

    console.log('✅ Free shipping applied:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('');

    // Final cart state
    console.log('🎯 Final Cart Summary:');
    console.log(`📦 Items: ${(cart as any).items.length}`);
    console.log(`💰 Subtotal: $${summary.subtotal}`);
    console.log(`🎟️  Discount (${summary.discount?.code}): -$${summary.discountAmount}`);
    console.log(`📊 Tax (${(summary.taxRate * 100)}%): $${summary.tax}`);
    console.log(`🚚 Shipping: $${summary.shipping}`);
    console.log(`💳 Total: $${summary.total}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAdvancedCart();
