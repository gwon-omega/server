import { connectDB } from "../database/connection";
import Cart from "../database/models/cartModel";

(async () => {
  try {
    await connectDB({ sync: true });

    // Test finding a cart
    const testUserId = 'f469c1fd-9ca2-4bfc-adae-45c1a12bbc9a';
    console.log('Looking for cart with userId:', testUserId);

    const cart = await Cart.findOne({ where: { userId: testUserId } });
    console.log('Cart found:', cart ? 'Yes' : 'No');

    if (!cart) {
      console.log('Creating test cart...');
      const newCart = await Cart.create({
        userId: testUserId,
        items: [{ productId: '836329df-c83e-4fa3-9ef0-37d71cc7b4aa', quantity: 1, price: 18 }],
        total: 18
      });
      console.log('Test cart created');
    } else {
      console.log('Existing cart items:', (cart as any).items?.length || 0);
    }

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
