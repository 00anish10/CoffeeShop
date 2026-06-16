import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { getDashboard, listOrders, getInventory, updateInventory } from '../controllers/adminController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', asyncHandler(getDashboard));
router.get('/orders', asyncHandler(listOrders));
router.get('/inventory', asyncHandler(getInventory));
router.put('/inventory/:productId', asyncHandler(updateInventory));

export default router;
