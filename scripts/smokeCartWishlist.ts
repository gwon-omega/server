import axios from 'axios';

async function main() {
  const baseURL = process.env.API_URL || 'http://localhost:5000/api';
  const client = axios.create({ baseURL, validateStatus: () => true });

  // 1) Login
  const loginRes = await client.post('/auth/login', { email: 'user@dgit.com.np', password: 'user' });
  if (loginRes.status !== 200) {
    console.error('Login failed', loginRes.status, loginRes.data);
    process.exit(1);
  }
  const token: string = loginRes.data.token;
  const userId: string = loginRes.data.user?.id;
  console.log('Login OK. User:', userId.substring(0, 8), 'Token len:', token.length);

  const auth = axios.create({ baseURL, headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });

  // 2) Pick first product
  const products = await client.get('/products');
  if (products.status !== 200 || !products.data?.products?.length) {
    console.error('No products available', products.status, products.data);
    process.exit(1);
  }
  const productId: string = products.data.products[0].productId;
  console.log('Using product:', productId);

  // 3) Add to wishlist
  const wishAdd = await auth.post('/wishlist/add', { productId });
  console.log('Wishlist add ->', wishAdd.status, wishAdd.data?.message || wishAdd.data);

  // 4) Read wishlist
  const wishGet = await auth.get(`/wishlist/${userId}`);
  console.log('Wishlist get ->', wishGet.status, `items: ${wishGet.data?.items?.length ?? 0}`);

  // 5) Add to cart
  const cartAdd = await auth.post('/cart/add', { userId, productId, quantity: 1 });
  console.log('Cart add ->', cartAdd.status, cartAdd.data?.message || cartAdd.data);

  // 6) Read cart
  const cartGet = await auth.get(`/cart/${userId}`);
  console.log('Cart get ->', cartGet.status, `items: ${cartGet.data?.items?.length ?? 0}`, 'total:', cartGet.data?.total);
}

main().catch((e) => {
  console.error('Smoke test failed', e);
  process.exit(1);
});
