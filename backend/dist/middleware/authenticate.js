"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const authService_1 = require("../services/authService");
const AppError_1 = require("../utils/AppError");
const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError_1.AppError(401, 'Missing or malformed authorization header', 'UNAUTHORIZED'));
    }
    const token = authHeader.split(' ')[1];
    const payload = (0, authService_1.verifyToken)(token);
    if (!payload) {
        return next(new AppError_1.AppError(401, 'Invalid or expired token', 'TOKEN_EXPIRED'));
    }
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
};
exports.authenticate = authenticate;
//# sourceMappingURL=authenticate.js.map