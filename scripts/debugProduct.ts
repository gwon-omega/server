import { connectDB } from "../database/connection";
import Product from "../database/models/productModel";

const getVal = (obj: any, key: string) => (obj && typeof obj.get === 'function') ? obj.get(key) : obj?.[key];

const computeItemPrice = (product: any) => {
  const base = Number(getVal(product, 'productPrice')) || 0;
  let discount = Number(getVal(product, 'productDiscount')) || 0; // percentage
  discount = Math.min(Math.max(discount, 0), 100);
  const price = base - (base * discount) / 100;
  return isNaN(price) ? 0 : parseFloat(price.toFixed(2));
};

(async () => {
  try {
    await connectDB();
    const id = process.argv[2];
    if (!id) {
      console.error('Usage: ts-node scripts/debugProduct.ts <productId>');
      process.exit(1);
    }
    const p = await (Product as any).findByPk(id);
    if (!p) {
      console.log('Product not found');
      process.exit(0);
    }
    const name = getVal(p, 'productName');
    const price = getVal(p, 'productPrice');
    const disc = getVal(p, 'productDiscount');
    console.log('Product:', { name, price, disc });
    console.log('Computed price:', computeItemPrice(p));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
