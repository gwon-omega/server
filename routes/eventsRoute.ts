import { Router } from 'express';
import { eventBus } from '../events/eventBus';

const router = Router();

// Server-Sent Events endpoint
router.get('/', (req, res) => {
  // Basic headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const user = (req as any).user; // if auth middleware attaches user
  const userId = user?.userId || user?.id; // may be undefined for anonymous events (we might later filter)

  const write = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const onCartUpdated = (payload: any) => {
    if (payload?.userId && userId && String(payload.userId) !== String(userId)) return; // filter by user
    write('cart.updated', payload);
  };
  const onCartFailed = (payload: any) => {
    if (payload?.userId && userId && String(payload.userId) !== String(userId)) return;
    write('cart.failed', payload);
  };
  const onPing = (payload: any) => write('ping', payload);

  eventBus.on('cart.updated', onCartUpdated);
  eventBus.on('cart.failed', onCartFailed);
  eventBus.on('ping', onPing);

  req.on('close', () => {
    eventBus.off('cart.updated', onCartUpdated);
    eventBus.off('cart.failed', onCartFailed);
    eventBus.off('ping', onPing);
  });
});

export default router;
