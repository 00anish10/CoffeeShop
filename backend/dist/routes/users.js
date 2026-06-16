"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const userController_1 = require("../controllers/userController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.get('/me', authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(userController_1.getProfile));
router.put('/me', authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(userController_1.updateProfile));
router.get('/', authenticate_1.authenticate, (0, asyncHandler_1.asyncHandler)(userController_1.getUsers));
exports.default = router;
//# sourceMappingURL=users.js.map