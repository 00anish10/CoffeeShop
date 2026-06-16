import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { parsePage } from '../utils/pagination';
import { Prisma } from '@prisma/client';
import { getIO } from '../socket';

export const getDashboard = async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todayAgg,
    topProducts,
    recentOrders,
    newCustomers,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: today },
        paymentStatus: 'PAID',
      },
      _sum: { totalAmount: true },
      _count: true,
      _avg: { totalAmount: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: today } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.user.count({
      where: { createdAt: { gte: today } },
    }),
  ]);

  const topProductDetails = await prisma.product.findMany({
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

export const listOrders = async (req: Request, res: Response) => {
  const { status, startDate, endDate, userId } = req.query as Record<string, string | undefined>;
  const pagination = parsePage(req.query as any);

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status as any;
  if (startDate) where.createdAt = { ...(where.createdAt as any || {}), gte: new Date(startDate) };
  if (endDate) where.createdAt = { ...(where.createdAt as any || {}), lte: new Date(endDate) };
  if (userId) where.userId = userId;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.order.count({ where }),
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

export const getInventory = async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
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

export const updateInventory = async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  const { stockLevel, lowStockThreshold } = req.body;

  const inventory = await prisma.inventory.findUnique({ where: { productId } });
  if (!inventory) {
    res.status(404).json({ error: { message: 'Inventory not found', code: 'NOT_FOUND' } });
    return;
  }

  const wasLow = inventory.stockLevel <= inventory.lowStockThreshold;

  const updated = await prisma.inventory.update({
    where: { productId },
    data: {
      stockLevel: stockLevel ?? inventory.stockLevel,
      lowStockThreshold: lowStockThreshold ?? inventory.lowStockThreshold,
      lastRestocked: stockLevel !== undefined ? new Date() : inventory.lastRestocked,
    },
  });

  const nowLow = updated.stockLevel <= updated.lowStockThreshold;
  if (wasLow && !nowLow) {
    const io = getIO();
    io.to('admin').emit('inventory:restocked', { productId, stockLevel: updated.stockLevel });
  }

  res.json(updated);
};
