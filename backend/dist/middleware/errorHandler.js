"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            error: {
                message: err.message,
                code: err.code,
            },
        });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({
        error: {
            message: 'Internal server error',
            code: 'INTERNAL',
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map