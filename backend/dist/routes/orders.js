"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const validate_1 = require("../middleware/validate");
const orderController_1 = require("../controllers/orderController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
const orderItemSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    variantId: zod_1.z.string().optional(),
    quantity: zod_1.z.number().int().min(1),
    customizations: zod_1.z.any().optional(),
});
const createOrderSchema = zod_1.z.object({
    items: zod_1.z.array(orderItemSchema).min(1, 'At least one item is required'),
    tableNumber: zod_1.z.number().int().positive().optional(),
    specialInstructions: zod_1.z.string().max(500).optional(),
    loyaltyPointsToRedeem: zod_1.z.number().int().min(0).optional(),
});
const statusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'BREWING', 'READY', 'DELIVERED', 'CANCELLED']),
});
router.post('/', authenticate_1.authenticate, (0, validate_1.validate)(createOrderSchema), (0, asyncHandler_1.asyncHandler)(orderController_1.createOrder));
router.get('/my', authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(orderController_1.getMyOrders));
router.get('/:id', authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(orderController_1.getOrder));
router.put('/:id/status', authenticate_1.authenticate, (0, authorize_1.requireRole)('BARISTA', 'ADMIN'), (0, validate_1.validate)(statusSchema), (0, asyncHandler_1.asyncHandler)(orderController_1.updateOrderStatus));
router.post('/:id/cancel', authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(orderController_1.cancelOrder));
exports.default = router;
//# sourceMappingURL=orders.js.map