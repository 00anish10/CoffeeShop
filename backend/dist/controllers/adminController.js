"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInventory = exports.getInventory = exports.listOrders = exports.getDashboard = void 0;
const prisma_1 = require("../lib/prisma");
const pagination_1 = require("../utils/pagination");
const socket_1 = require("../socket");
const getDashboard = async (_req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayAgg, topProducts, recentOrders, newCustomers,] = await Promise.all([
        prisma_1.prisma.order.aggregate({
            where: {
                createdAt: { gte: today },
                paymentStatus: 'PAID',
            },
            _sum: { totalAmount: true },
            _count: true,
            _avg: { totalAmount: true },
        }),
        prisma_1.prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        }),
        prisma_1.prisma.order.findMany({
            where: { createdAt: { gte: today } },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10,
        }),
        prisma_1.prisma.user.count({
            where: { createdAt: { gte: today } },
        }),
    ]);
    const topProductDetails = await prisma_1.prisma.product.findMany({
        where: { id: { in: topProducts.map((p) => p.productId) } },
        select: { id: true, name: true, slug: true },
    });
    const topProductsMapped = topProducts.map((p) => ({
        ...topProductDetails.find((d) => d.id === p.productId),
        quantitySold: p._sum.quantity || 0,
    }));
    res.json({
        today: {
            totalRevenue: todayAgg._sum.totalAmount || 0,
            orderCount: todayAgg._count,
            avgOrderValue: todayAgg._avg.totalAmount || 0,
            newCustomers,
        },
        topProducts: topProductsMapped,
        recentOrders,
    });
};
exports.getDashboard = getDashboard;
const listOrders = async (req, res) => {
    const { status, startDate, endDate, userId } = req.query;
    const pagination = (0, pagination_1.parsePage)(req.query);
    const where = {};
    if (status)
        where.status = status;
    if (startDate)
        where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate) };
    if (endDate)
        where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };
    if (userId)
        where.userId = userId;
    const [orders, total] = await Promise.all([
        prisma_1.prisma.order.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                items: { include: { product: { select: { id: true, name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
            skip: pagination.skip,
            take: pagination.take,
        }),
        prisma_1.prisma.order.count({ where }),
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
exports.listOrders = listOrders;
const getInventory = async (_req, res) => {
    const products = await prisma_1.prisma.product.findMany({
        where: { isAvailable: true },
        include: { inventory: true },
        orderBy: { name: 'asc' },
    });
    const inventoryWithFlags = products.map((p) => ({
        ...p,
        isLowStock: p.inventory ? p.inventory.stockLevel <= p.inventory.lowStockThreshold : false,
    }));
    res.json({ inventory: inventoryWithFlags });
};
exports.getInventory = getInventory;
const updateInventory = async (req, res) => {
    const productId = req.params.productId;
    const { stockLevel, lowStockThreshold } = req.body;
    const inventory = await prisma_1.prisma.inventory.findUnique({ where: { productId } });
    if (!inventory) {
        res.status(404).json({ error: { message: 'Inventory not found', code: 'NOT_FOUND' } });
        return;
    }
    const wasLow = inventory.stockLevel <= inventory.lowStockThreshold;
    const updated = await prisma_1.prisma.inventory.update({
        where: { productId },
        data: {
            stockLevel: stockLevel ?? inventory.stockLevel,
            lowStockThreshold: lowStockThreshold ?? inventory.lowStockThreshold,
            lastRestocked: stockLevel !== undefined ? new Date() : inventory.lastRestocked,
        },
    });
    const nowLow = updated.stockLevel <= updated.lowStockThreshold;
    if (wasLow && !nowLow) {
        const io = (0, socket_1.getIO)();
        io.to('admin').emit('inventory:restocked', { productId, stockLevel: updated.stockLevel });
    }
    res.json(updated);
};
exports.updateInventory = updateInventory;
//# sourceMappingURL=adminController.js.map