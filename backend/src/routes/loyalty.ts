import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { getBalance, redeem } from '../controllers/loyaltyController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const redeemSchema = z.object({
  points: z.number().int().positive('Points must be positive'),
});

router.get('/balance', authenticate, asyncHandler(getBalance));
router.post('/redeem', authenticate, validate(redeemSchema), asyncHandler(redeem));

export default router;
