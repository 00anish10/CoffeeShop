"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authenticate_1 = require("../middleware/authenticate");
const validate_1 = require("../middleware/validate");
const loyaltyController_1 = require("../controllers/loyaltyController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
const redeemSchema = zod_1.z.object({
    points: zod_1.z.number().int().positive('Points must be positive'),
});
router.get('/balance', authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(loyaltyController_1.getBalance));
router.post('/redeem', authenticate_1.authenticate, (0, validate_1.validate)(redeemSchema), (0, asyncHandler_1.asyncHandler)(loyaltyController_1.redeem));
exports.default = router;
//# sourceMappingURL=loyalty.js.map