import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { constructWebhookEvent } from '../services/stripeService';
import { deductStock } from '../services/inventoryService';
import { awardPoints } from '../services/loyaltyService';
import { getIO } from '../socket';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/webhook', asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    res.status(400).json({ error: { message: 'Invalid webhook signature', code: 'INVALID_SIGNATURE' } });
    return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: { items: true },
      });

      if (order && order.paymentStatus !== 'PAID') {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
        });

        await deductStock(order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));

        await awardPoints(order.userId, order.id, Number(order.totalAmount));

        const io = getIO();
        io.to(`order:${order.id}`).emit('order:status_changed', {
          orderId: order.id,
          status: 'CONFIRMED',
        });
        io.to('kitchen').emit('order:status_changed', {
          orderId: order.id,
          status: 'CONFIRMED',
          tableNumber: order.tableNumber,
        });
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
        });
      }
      break;
    }
  }

  res.json({ received: true });
}));

export default router;
