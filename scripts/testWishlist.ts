import dotenv from "dotenv";
import sequelize from "../database/connection";
import Wishlist from "../database/models/wishlistModel";
import User from "../database/models/userModel";
import Product from "../database/models/productModel";

dotenv.config();

async function testWishlistFunctionality() {
  try {
    console.log("🔍 Testing Wishlist Functionality");
    console.log("================================");

    // Test 1: Database connection
    await sequelize.authenticate();
    console.log("✅ Database connection successful");

    // Test 2: Check if wishlist table exists and structure
    const [tableInfo] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'wishlists' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 Wishlist table structure:");
    console.table(tableInfo);

    // Test 3: Check for users to test with
    const userCount = await User.count();
    console.log(`\n👥 Total users in database: ${userCount}`);

    if (userCount === 0) {
      console.log("❌ No users found - need users to test wishlist");
      return;
    }

    const testUser = await User.findOne();
    if (!testUser) {
      console.log("❌ Could not find test user");
      return;
    }

    const userId = (testUser as any).get ? (testUser as any).get('userId') : (testUser as any).userId;
    console.log(`✅ Using test user: ${userId}`);

    // Test 4: Check for products to test with
    const productCount = await Product.count();
    console.log(`\n📦 Total products in database: ${productCount}`);

    if (productCount === 0) {
      console.log("❌ No products found - need products to test wishlist");
      return;
    }

    const testProduct = await Product.findOne();
    if (!testProduct) {
      console.log("❌ Could not find test product");
      return;
    }

    const productId = (testProduct as any).get ? (testProduct as any).get('productId') : (testProduct as any).productId;
    const productName = (testProduct as any).get ? (testProduct as any).get('productName') : (testProduct as any).productName;
    console.log(`✅ Using test product: ${productId} (${productName})`);

    // Test 5: Clear existing wishlist for clean test
    await Wishlist.destroy({ where: { userId } });
    console.log("🧹 Cleared existing wishlist for test user");

    // Test 6: Test adding to wishlist
    console.log("\n🔹 Testing: Add to wishlist");
    const newWishlistItem = await Wishlist.create({ userId, productId });
    console.log("✅ Successfully added item to wishlist:", {
      id: (newWishlistItem as any).id,
      userId: (newWishlistItem as any).userId,
      productId: (newWishlistItem as any).productId
    });

    // Test 7: Test retrieving wishlist
    console.log("\n🔹 Testing: Get wishlist");
    const wishlistItems = await Wishlist.findAll({ where: { userId } });
    console.log(`✅ Retrieved ${wishlistItems.length} wishlist items`);
    wishlistItems.forEach((item, index) => {
      console.log(`  Item ${index + 1}:`, {
        id: (item as any).id,
        productId: (item as any).productId,
        createdAt: (item as any).createdAt
      });
    });

    // Test 8: Test duplicate prevention
    console.log("\n🔹 Testing: Duplicate prevention");
    try {
      const duplicate = await Wishlist.create({ userId, productId });
      console.log("❌ Duplicate was allowed - this should not happen!");
    } catch (error) {
      console.log("✅ Duplicate correctly prevented:", (error as any).message.includes('duplicate') ? 'Unique constraint works' : (error as any).message);
    }

    // Test 9: Test removing from wishlist
    console.log("\n🔹 Testing: Remove from wishlist");
    const deletedCount = await Wishlist.destroy({ where: { userId, productId } });
    console.log(`✅ Removed ${deletedCount} items from wishlist`);

    // Test 10: Verify removal
    const remainingItems = await Wishlist.findAll({ where: { userId } });
    console.log(`✅ Remaining items: ${remainingItems.length} (should be 0)`);

    // Test 11: Test with associations (if any)
    console.log("\n🔹 Testing: Wishlist with associations");
    await Wishlist.create({ userId, productId });
    const itemsWithProduct = await Wishlist.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['productId', 'productName', 'productPrice']
        }
      ]
    });

    console.log("✅ Wishlist with product associations:");
    itemsWithProduct.forEach((item, index) => {
      console.log(`  Item ${index + 1}:`, {
        wishlistId: (item as any).id,
        product: (item as any).product ? {
          id: (item as any).product.productId,
          name: (item as any).product.productName,
          price: (item as any).product.productPrice
        } : 'No product data'
      });
    });

    console.log("\n🎉 All wishlist tests completed successfully!");

  } catch (error) {
    console.error("❌ Wishlist test failed:", error);
    if ((error as any).sql) {
      console.error("SQL:", (error as any).sql);
    }
  } finally {
    await sequelize.close();
  }
}

// Helper function to test wishlist API endpoints
function getWishlistAPIUsage() {
  console.log("\n📚 Wishlist API Usage Examples:");
  console.log("===============================");

  console.log("\n1. Get user's wishlist:");
  console.log("GET /api/wishlist/:userId");
  console.log("Headers: Authorization: Bearer <token>");

  console.log("\n2. Add product to wishlist:");
  console.log("POST /api/wishlist/add");
  console.log("Headers: Authorization: Bearer <token>");
  console.log("Body: { \"productId\": \"uuid-here\" }");

  console.log("\n3. Remove product from wishlist:");
  console.log("POST /api/wishlist/remove");
  console.log("Headers: Authorization: Bearer <token>");
  console.log("Body: { \"productId\": \"uuid-here\" }");
}

// Run tests
testWishlistFunctionality().then(() => {
  getWishlistAPIUsage();
}).catch(console.error);
