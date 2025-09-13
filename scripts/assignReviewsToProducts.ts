import { connectDB } from "../database/connection";
import Review from "../database/models/reviewModel";
import Product from "../database/models/productModel";

async function assignReviewsToProducts() {
  await connectDB({ sync: true });

  // Get first 5 products
  const products = await Product.findAll({
    limit: 5,
    attributes: ['productId'],
    raw: true
  });

  if (products.length === 0) {
    console.log('No products found');
    return;
  }

  const productIds = products.map((p: any) => p.productId);

  // Get reviews without productId
  const reviewsToUpdate = await Review.findAll({
    where: { productId: null },
    limit: 15,
    attributes: ['reviewId'],
    raw: true
  });

  let updated = 0;
  for (const review of reviewsToUpdate) {
    const productId = productIds[updated % productIds.length];
    await Review.update(
      { productId },
      { where: { reviewId: (review as any).reviewId } }
    );
    updated++;
  }

  console.log(`Updated ${updated} reviews with productIds`);
  console.log(`Used product IDs: ${productIds.join(', ')}`);
}

if (require.main === module) {
  assignReviewsToProducts()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });
}

export default assignReviewsToProducts;
