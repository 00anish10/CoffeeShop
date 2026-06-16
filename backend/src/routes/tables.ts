import { Router } from 'express';
import { getTableByQrCode } from '../controllers/tableController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/:qrCode', asyncHandler(getTableByQrCode));

export default router;
