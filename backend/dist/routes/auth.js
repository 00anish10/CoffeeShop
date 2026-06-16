"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authController_1 = require("../controllers/authController");
const validate_1 = require("../middleware/validate");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: zod_1.z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
router.post('/register', (0, validate_1.validate)(registerSchema), (0, asyncHandler_1.asyncHandler)(authController_1.register));
router.post('/login', (0, validate_1.validate)(loginSchema), (0, asyncHandler_1.asyncHandler)(authController_1.login));
router.post('/refresh', (0, asyncHandler_1.asyncHandler)(authController_1.refresh));
router.post('/logout', (0, asyncHandler_1.asyncHandler)(authController_1.logout));
exports.default = router;
//# sourceMappingURL=auth.js.map