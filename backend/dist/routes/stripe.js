"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const stripeService_1 = require("../services/stripeService");
const inventoryService_1 = require("../services/inventoryService");
const loyaltyService_1 = require("../services/loyaltyService");
const socket_1 = require("../socket");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.post('/webhook', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = (0, stripeService_1.constructWebhookEvent)(req.body, sig);
    }
    catch (err) {
        res.status(400).json({ error: { message: 'Invalid webhook signature', code: 'INVALID_SIGNATURE' } });
        return;
    }
    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            const order = await prisma_1.prisma.order.findFirst({
                where: { stripePaymentIntentId: paymentIntent.id },
                include: { items: true },
            });
            if (order && order.paymentStatus !== 'PAID') {
                await prisma_1.prisma.order.update({
                    where: { id: order.id },
                    data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
                });
                await (0, inventoryService_1.deductStock)(order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
                await (0, loyaltyService_1.awardPoints)(order.userId, order.id, Number(order.totalAmount));
                const io = (0, socket_1.getIO)();
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
            const order = await prisma_1.prisma.order.findFirst({
                where: { stripePaymentIntentId: paymentIntent.id },
            });
            if (order) {
                await prisma_1.prisma.order.update({
                    where: { id: order.id },
                    data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
                });
            }
            break;
        }
    }
    res.json({ received: true });
}));
exports.default = router;
//# sourceMappingURL=stripe.js.map