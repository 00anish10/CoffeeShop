import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { parsePage } from '../utils/pagination';
import { AppError } from '../utils/AppError';
import { createPaymentIntent, refund } from '../services/stripeService';
import { redeemPoints } from '../services/loyaltyService';
import { checkAvailability } from '../services/inventoryService';
import { calculateEstimatedReady } from '../services/brewService';
import { Prisma, OrderStatus } from '@prisma/client';
import { getIO } from '../socket';

export const createOrder = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { items, tableNumber, specialInstructions, loyaltyPointsToRedeem } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'Order must contain at least one item', 'VALIDATION_ERROR');
  }

  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isAvailable: true },
    include: { variants: true, inventory: true },
  });

  if (products.length !== productIds.length) {
    throw new AppError(400, 'One or more products are unavailable', 'PRODUCT_UNAVAILABLE');
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  await checkAvailability(items.map((i: { productId: string; quantity: number }) => ({
    productId: i.productId,
    quantity: i.quantity,
  })));

  let subtotal = new Prisma.Decimal(0);
  const orderItemsData: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    customizations?: any;
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId)!;
    let unitPrice = product.price;

    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new AppError(400, `Variant ${item.variantId} not found for product ${item.productId}`, 'INVALID_VARIANT');
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
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.loyaltyPoints < loyaltyPointsToRedeem) {
      throw new AppError(400, 'Insufficient loyalty points', 'INSUFFICIENT_POINTS');
    }
    loyaltyDiscount = loyaltyPointsToRedeem / 100;
  }

  const total = Prisma.Decimal.max(new Prisma.Decimal(1.0), subtotal.sub(loyaltyDiscount));

  const estimatedReadyAt = calculateEstimatedReady(
    items.map((i: { productId: string; quantity: number }) => ({
      product: productMap.get(i.productId)!,
      quantity: i.quantity,
    }))
  );

  const maxPrepMins = Math.max(
    ...items.map((i: { productId: string }) => productMap.get(i.productId)!.preparationMinutes)
  );

  const paymentIntent = await createPaymentIntent(
    Math.round(total.toNumber() * 100),
    { userId, tableNumber: tableNumber?.toString() || '' }
  );

  const order = await prisma.$transaction(async (tx) => {
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
      await redeemPoints(userId, created.id, loyaltyPointsToRedeem);
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

export const getMyOrders = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const pagination = parsePage(req.query as any);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: { select: { id: true, name: true, slug: true, imageUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.order.count({ where: { userId } }),
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

export const getOrder = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const order = await prisma.order.findUnique({
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
    throw new AppError(404, 'Order not found', 'NOT_FOUND');
  }

  if (order.userId !== userId && userRole !== 'BARISTA' && userRole !== 'ADMIN') {
    throw new AppError(403, 'Access denied', 'FORBIDDEN');
  }

  res.json(order);
};

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['BREWING', 'CANCELLED'],
  BREWING: ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status: newStatus } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    throw new AppError(404, 'Order not found', 'NOT_FOUND');
  }

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    throw new AppError(400, `Cannot transition from ${order.status} to ${newStatus}`, 'INVALID_TRANSITION');
  }

  const updateData: Prisma.OrderUpdateInput = { status: newStatus };
  if (newStatus === 'BREWING') {
    const now = new Date();
    const maxPrepMins = Math.max(...order.items.map((i) => i.product.preparationMinutes));
    updateData.brewStartedAt = now;
    updateData.estimatedReadyAt = new Date(now.getTime() + maxPrepMins * 60 * 1000);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      items: { include: { product: true, variant: true } },
      user: { select: { id: true, name: true } },
    },
  });

  const io = getIO();
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
    const minutesRemaining = Math.max(
      ...order.items.map((i) => i.product.preparationMinutes)
    );
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

export const cancelOrder = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;

  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    throw new AppError(404, 'Order not found', 'NOT_FOUND');
  }

  if (order.userId !== userId) {
    throw new AppError(403, 'You can only cancel your own orders', 'FORBIDDEN');
  }

  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    throw new AppError(400, `Cannot cancel order in ${order.status} status`, 'INVALID_STATUS');
  }

  const updateData: Prisma.OrderUpdateInput = { status: 'CANCELLED' };

  if (order.paymentStatus === 'PAID' && order.stripePaymentIntentId) {
    await refund(order.stripePaymentIntentId);
    updateData.paymentStatus = 'REFUNDED';
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
  });

  const io = getIO();
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
