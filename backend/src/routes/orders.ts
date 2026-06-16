import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createOrder, getMyOrders, getOrder, updateOrderStatus, cancelOrder } from '../controllers/orderController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const orderItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1),
  customizations: z.any().optional(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  tableNumber: z.number().int().positive().optional(),
  specialInstructions: z.string().max(500).optional(),
  loyaltyPointsToRedeem: z.number().int().min(0).optional(),
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'BREWING', 'READY', 'DELIVERED', 'CANCELLED']),
});

router.post('/', authenticate, validate(createOrderSchema), asyncHandler(createOrder));
router.get('/my', authenticate, asyncHandler(getMyOrders));
router.get('/:id', authenticate, asyncHandler(getOrder));
router.put('/:id/status', authenticate, requireRole('BARISTA', 'ADMIN'), validate(statusSchema), asyncHandler(updateOrderStatus));
router.post('/:id/cancel', authenticate, asyncHandler(cancelOrder));

export default router;
