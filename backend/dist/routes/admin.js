"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const adminController_1 = require("../controllers/adminController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate, (0, authorize_1.requireRole)('ADMIN'));
router.get('/dashboard', (0, asyncHandler_1.asyncHandler)(adminController_1.getDashboard));
router.get('/orders', (0, asyncHandler_1.asyncHandler)(adminController_1.listOrders));
router.get('/inventory', (0, asyncHandler_1.asyncHandler)(adminController_1.getInventory));
router.put('/inventory/:productId', (0, asyncHandler_1.asyncHandler)(adminController_1.updateInventory));
exports.default = router;
//# sourceMappingURL=admin.js.map