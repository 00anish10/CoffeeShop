import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import {
  listProducts,
  getProduct,
  listCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { asyncHandler } from '../utils/asyncHandler';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and AVIF images are allowed'));
    }
  },
});

const router = Router();

router.get('/categories', asyncHandler(listCategories));
router.get('/', asyncHandler(listProducts));
router.get('/:slug', asyncHandler(getProduct));
router.post('/', authenticate, requireRole('ADMIN'), upload.single('image'), asyncHandler(createProduct));
router.put('/:id', authenticate, requireRole('ADMIN'), upload.single('image'), asyncHandler(updateProduct));
router.delete('/:id', authenticate, requireRole('ADMIN'), asyncHandler(deleteProduct));

export default router;
