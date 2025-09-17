import axios, { AxiosError } from 'axios';

const BASE_URL = 'http://localhost:8080/api';

interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  userId: string;
  fullName: string;
  email: string;
  token: string;
}

interface Product {
  productId: string;
  productName: string;
  productPrice: number;
}

// Simple test functions
async function testWishlistCRUD() {
  console.log('🧪 Starting Simple Wishlist Tests...\n');

  try {
    // Test 1: Check if wishlist endpoint is accessible (without auth)
    console.log('1️⃣ Testing wishlist endpoint accessibility...');
    try {
      const response = await axios.get(`${BASE_URL}/wishlist/test-user-id`);
      console.log('✅ Wishlist endpoint is accessible');
      console.log(`Status: ${response.status}`);
      console.log(`Data:`, response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.log(`❌ Wishlist endpoint error: ${axiosError.response?.status} - ${axiosError.message}`);

      if (axiosError.response?.status === 401) {
        console.log('📝 Note: This is expected if authentication is required');
      } else if (axiosError.response?.status === 404) {
        console.log('📝 Note: This might indicate the endpoint doesn\'t exist or is misconfigured');
      }
    }

    // Test 2: Test with different HTTP methods
    console.log('\n2️⃣ Testing different HTTP methods...');

    // Test GET method
    try {
      await axios.get(`${BASE_URL}/wishlist/sample-user-id`);
      console.log('✅ GET method works');
    } catch (error) {
      const axiosError = error as AxiosError;
      console.log(`❌ GET method failed: ${axiosError.response?.status} - ${axiosError.response?.statusText}`);
    }

    // Test POST method (add to wishlist)
    try {
      await axios.post(`${BASE_URL}/wishlist/add`, {
        userId: 'sample-user-id',
        productId: 'sample-product-id'
      });
      console.log('✅ POST method works');
    } catch (error) {
      const axiosError = error as AxiosError;
      console.log(`❌ POST method failed: ${axiosError.response?.status} - ${axiosError.response?.statusText}`);
    }

    // Test 3: Check server connection
    console.log('\n3️⃣ Testing server connection...');
    try {
      const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      console.log('✅ Server is running and responding');
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNREFUSED') {
        console.log('❌ Server is not running or not accessible on port 8080');
        console.log('💡 Make sure to start the server with: pnpm dev');
        return;
      } else if (axiosError.response?.status === 404) {
        console.log('⚠️ Server is running but /health endpoint not found (this is OK)');
      } else {
        console.log(`❌ Server connection error: ${axiosError.message}`);
      }
    }

    // Test 4: Test product endpoints (to verify overall API structure)
    console.log('\n4️⃣ Testing related endpoints...');
    try {
      const response = await axios.get(`${BASE_URL}/products/summaries`);
      console.log('✅ Products endpoint works');
      console.log(`Found ${Array.isArray(response.data) ? response.data.length : 'unknown'} products`);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.log(`❌ Products endpoint failed: ${axiosError.response?.status} - ${axiosError.response?.statusText}`);
    }

    console.log('\n📊 Test Summary:');
    console.log('- If you see 401 errors, this means authentication middleware is working');
    console.log('- If you see 404 errors, check route configuration');
    console.log('- If you see ECONNREFUSED, start the server first');
    console.log('- If everything returns 200 status, the API structure is working correctly');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Potential Issues Analysis
function analyzePotentialIssues() {
  console.log('\n🔍 Potential Wishlist Issues Analysis:');
  console.log('\n1. ROUTE CONFIGURATION:');
  console.log('   - Check if wishlist routes are properly registered in server.ts');
  console.log('   - Verify route paths match the controller expectations');
  console.log('   - Ensure middleware order is correct');

  console.log('\n2. MIDDLEWARE ISSUES:');
  console.log('   - Wishlist routes only have basic middleware (securityChecker, isAuth)');
  console.log('   - Missing enhanced middleware compared to cart routes:');
  console.log('     * Request validation middleware');
  console.log('     * Rate limiting middleware');
  console.log('     * Ownership verification middleware');

  console.log('\n3. DATABASE ISSUES:');
  console.log('   - Check if wishlists table exists and has proper structure');
  console.log('   - Verify foreign key constraints with users and products tables');
  console.log('   - Ensure UUID generation is working for id field');

  console.log('\n4. AUTHENTICATION ISSUES:');
  console.log('   - JWT token extraction from headers');
  console.log('   - User ID validation and verification');
  console.log('   - Token expiration handling');

  console.log('\n5. CONTROLLER LOGIC ISSUES:');
  console.log('   - Error handling in add/remove/get operations');
  console.log('   - Duplicate prevention logic');
  console.log('   - Response formatting consistency');

  console.log('\n6. FRONTEND INTEGRATION ISSUES:');
  console.log('   - CORS configuration for wishlist endpoints');
  console.log('   - Request payload format expectations');
  console.log('   - Response data structure matching frontend expectations');
}

// Main execution
async function main() {
  await testWishlistCRUD();
  analyzePotentialIssues();
}

main().catch(console.error);
