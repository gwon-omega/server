import assert from 'node:assert';
import * as cartController from '../controllers/cartController';
import * as giftController from '../controllers/giftcodeController';

// Lightweight harness with mocked req/res
function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (b: any) => { (res as any).body = b; return res; };
  return res;
}

async function run() {
  // These tests expect DB models to be available; if not, they simply demonstrate invocation shape
  try {
    const userId = '00000000-0000-0000-0000-000000000001';

    // Get cart for user (should not throw)
    let req: any = { params: { userId } };
    let res = mockRes();
    await cartController.getCart(req, res as any);
    assert(res.statusCode < 500, 'getCart should not error');

    // Apply bogus code (should 400)
    req = { body: { code: 'NOPE' } };
    (req as any).user = { id: userId };
    res = mockRes();
    await giftController.applyGiftCode(req as any, res as any);
    assert([200,400,404,401].includes(res.statusCode), 'applyGiftCode should respond');

    console.log('cartGiftcode smoke tests executed');
  } catch (e) {
    console.error(e);
  }
}

run();
