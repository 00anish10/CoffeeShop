"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.updateOrderStatus = exports.getOrder = exports.getMyOrders = exports.createOrder = void 0;
const prisma_1 = require("../lib/prisma");
const pagination_1 = require("../utils/pagination");
const AppError_1 = require("../utils/AppError");
const stripeService_1 = require("../services/stripeService");
const loyaltyService_1 = require("../services/loyaltyService");
const inventoryService_1 = require("../services/inventoryService");
const brewService_1 = require("../services/brewService");
const client_1 = require("@prisma/client");
const socket_1 = require("../socket");
const createOrder = async (req, res) => {
    const userId = req.user.id;
    const { items, tableNumber, specialInstructions, loyaltyPointsToRedeem } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError_1.AppError(400, 'Order must contain at least one item', 'VALIDATION_ERROR');
    }
    const productIds = items.map((i) => i.productId);
    const products = await prisma_1.prisma.product.findMany({
        where: { id: { in: productIds }, isAvailable: true },
        include: { variants: true, inventory: true },
    });
    if (products.length !== productIds.length) {
        throw new AppError_1.AppError(400, 'One or more products are unavailable', 'PRODUCT_UNAVAILABLE');
    }
    const productMap = new Map(products.map((p) => [p.id, p]));
    await (0, inventoryService_1.checkAvailability)(items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
    })));
    let subtotal = new client_1.Prisma.Decimal(0);
    const orderItemsData = [];
    for (const item of items) {
        const product = productMap.get(item.productId);
        let unitPrice = product.price;
        if (item.variantId) {
            const variant = product.variants.find((v) => v.id === item.variantId);
            if (!variant) {
                throw new AppError_1.AppError(400, `Variant ${item.variantId} not found for product ${item.productId}`, 'INVALID_VARIANT');
            }
            unitPrice = product.price.add(variant.priceModifier);
        }
        const lineTotal = unitPrice.mul(item.quantity);
        subtotal = subtotal.add(lineTotal);
        orderItemsData.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice,
            customizations: item.customizations || undefined,
        });
    }
    let loyaltyDiscount = 0;
    if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.loyaltyPoints < loyaltyPointsToRedeem) {
            throw new AppError_1.AppError(400, 'Insufficient loyalty points', 'INSUFFICIENT_POINTS');
        }
        loyaltyDiscount = loyaltyPointsToRedeem / 100;
    }
    const total = client_1.Prisma.Decimal.max(new client_1.Prisma.Decimal(1.0), subtotal.sub(loyaltyDiscount));
    const estimatedReadyAt = (0, brewService_1.calculateEstimatedReady)(items.map((i) => ({
        product: productMap.get(i.productId),
        quantity: i.quantity,
    })));
    const maxPrepMins = Math.max(...items.map((i) => productMap.get(i.productId).preparationMinutes));
    const paymentIntent = await (0, stripeService_1.createPaymentIntent)(Math.round(total.toNumber() * 100), { userId, tableNumber: tableNumber?.toString() || '' });
    const order = await prisma_1.prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
            data: {
                userId,
                totalAmount: total,
                tableNumber: tableNumber || null,
                isTableOrder: !!tableNumber,
                specialInstructions,
                estimatedReadyAt,
                stripePaymentIntentId: paymentIntent.id,
                items: {
                    create: orderItemsData,
                },
            },
            include: {
                items: { include: { product: true, variant: true } },
                user: { select: { id: true, name: true, email: true } },
            },
        });
        if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
            await (0, loyaltyService_1.redeemPoints)(userId, created.id, loyaltyPointsToRedeem);
        }
        return created;
    });
    res.status(201).json({
        orderId: order.id,
        clientSecret: paymentIntent.client_secret,
        total: total.toNumber(),
        estimatedReadyAt,
        maxPrepMins,
    });
};
exports.createOrder = createOrder;
const getMyOrders = async (req, res) => {
    const userId = req.user.id;
    const pagination = (0, pagination_1.parsePage)(req.query);
    const [orders, total] = await Promise.all([
        prisma_1.prisma.order.findMany({
            where: { userId },
            include: {
                items: { include: { product: { select: { id: true, name: true, slug: true, imageUrl: true } } } },
            },
            orderBy: { createdAt: 'desc' },
            skip: pagination.skip,
            take: pagination.take,
        }),
        prisma_1.prisma.order.count({ where: { userId } }),
    ]);
    res.json({
        orders,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages: Math.ceil(total / pagination.limit),
        },
    });
};
exports.getMyOrders = getMyOrders;
const getOrder = async (req, res) => {
    const id = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const order = await prisma_1.prisma.order.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: { include: { category: true } },
                    variant: true,
                },
            },
            user: { select: { id: true, name: true, email: true } },
        },
    });
    if (!order) {
        throw new AppError_1.AppError(404, 'Order not found', 'NOT_FOUND');
    }
    if (order.userId !== userId && userRole !== 'BARISTA' && userRole !== 'ADMIN') {
        throw new AppError_1.AppError(403, 'Access denied', 'FORBIDDEN');
    }
    res.json(order);
};
exports.getOrder = getOrder;
const VALID_TRANSITIONS = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['BREWING', 'CANCELLED'],
    BREWING: ['READY'],
    READY: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
};
const updateOrderStatus = async (req, res) => {
    const id = req.params.id;
    const { status: newStatus } = req.body;
    const order = await prisma_1.prisma.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
    });
    if (!order) {
        throw new AppError_1.AppError(404, 'Order not found', 'NOT_FOUND');
    }
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
        throw new AppError_1.AppError(400, `Cannot transition from ${order.status} to ${newStatus}`, 'INVALID_TRANSITION');
    }
    const updateData = { status: newStatus };
    if (newStatus === 'BREWING') {
        const now = new Date();
        const maxPrepMins = Math.max(...order.items.map((i) => i.product.preparationMinutes));
        updateData.brewStartedAt = now;
        updateData.estimatedReadyAt = new Date(now.getTime() + maxPrepMins * 60 * 1000);
    }
    const updated = await prisma_1.prisma.order.update({
        where: { id },
        data: updateData,
        include: {
            items: { include: { product: true, variant: true } },
            user: { select: { id: true, name: true } },
        },
    });
    const io = (0, socket_1.getIO)();
    io.to(`order:${id}`).emit('order:status_changed', {
        orderId: id,
        status: newStatus,
        estimatedReadyAt: updated.estimatedReadyAt,
    });
    io.to('kitchen').emit('order:status_changed', {
        orderId: id,
        status: newStatus,
        estimatedReadyAt: updated.estimatedReadyAt,
        tableNumber: updated.tableNumber,
    });
    if (newStatus === 'BREWING') {
        const minutesRemaining = Math.max(...order.items.map((i) => i.product.preparationMinutes));
        io.to(`order:${id}`).emit('order:brew_started', {
            orderId: id,
            estimatedReadyAt: updated.estimatedReadyAt,
            minutesRemaining,
        });
    }
    if (newStatus === 'READY') {
        io.to(`order:${id}`).emit('order:ready', {
            orderId: id,
            tableNumber: updated.tableNumber,
            message: `Order #${id.slice(0, 8)} is ready!`,
        });
        io.to(`user:${order.userId}`).emit('order:ready', { orderId: id });
    }
    res.json(updated);
};
exports.updateOrderStatus = updateOrderStatus;
const cancelOrder = async (req, res) => {
    const id = req.params.id;
    const userId = req.user.id;
    const order = await prisma_1.prisma.order.findUnique({ where: { id } });
    if (!order) {
        throw new AppError_1.AppError(404, 'Order not found', 'NOT_FOUND');
    }
    if (order.userId !== userId) {
        throw new AppError_1.AppError(403, 'You can only cancel your own orders', 'FORBIDDEN');
    }
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
        throw new AppError_1.AppError(400, `Cannot cancel order in ${order.status} status`, 'INVALID_STATUS');
    }
    const updateData = { status: 'CANCELLED' };
    if (order.paymentStatus === 'PAID' && order.stripePaymentIntentId) {
        await (0, stripeService_1.refund)(order.stripePaymentIntentId);
        updateData.paymentStatus = 'REFUNDED';
    }
    const updated = await prisma_1.prisma.order.update({
        where: { id },
        data: updateData,
    });
    const io = (0, socket_1.getIO)();
    io.to(`order:${id}`).emit('order:status_changed', {
        orderId: id,
        status: 'CANCELLED',
    });
    io.to('kitchen').emit('order:status_changed', {
        orderId: id,
        status: 'CANCELLED',
    });
    res.json(updated);
};
exports.cancelOrder = cancelOrder;
//# sourceMappingURL=orderController.js.map