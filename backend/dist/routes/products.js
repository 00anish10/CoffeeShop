"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const productController_1 = require("../controllers/productController");
const asyncHandler_1 = require("../utils/asyncHandler");
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPEG, PNG, WebP, and AVIF images are allowed'));
        }
    },
});
const router = (0, express_1.Router)();
router.get('/categories', (0, asyncHandler_1.asyncHandler)(productController_1.listCategories));
router.get('/', (0, asyncHandler_1.asyncHandler)(productController_1.listProducts));
router.get('/:slug', (0, asyncHandler_1.asyncHandler)(productController_1.getProduct));
router.post('/', authenticate_1.authenticate, (0, authorize_1.requireRole)('ADMIN'), upload.single('image'), (0, asyncHandler_1.asyncHandler)(productController_1.createProduct));
router.put('/:id', authenticate_1.authenticate, (0, authorize_1.requireRole)('ADMIN'), upload.single('image'), (0, asyncHandler_1.asyncHandler)(productController_1.updateProduct));
router.delete('/:id', authenticate_1.authenticate, (0, authorize_1.requireRole)('ADMIN'), (0, asyncHandler_1.asyncHandler)(productController_1.deleteProduct));
exports.default = router;
//# sourceMappingURL=products.js.map