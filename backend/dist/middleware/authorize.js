"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const AppError_1 = require("../utils/AppError");
const requireRole = (...roles) => (req, _res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user.role)) {
        return next(new AppError_1.AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }
    next();
};
exports.requireRole = requireRole;
//# sourceMappingURL=authorize.js.map