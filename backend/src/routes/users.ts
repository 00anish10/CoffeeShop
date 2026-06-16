import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getProfile, updateProfile, getUsers } from '../controllers/userController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/me', authenticate, asyncHandler(getProfile));
router.put('/me', authenticate, asyncHandler(updateProfile));
router.get('/', authenticate, asyncHandler(getUsers));

export default router;
