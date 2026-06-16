"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const AppError_1 = require("../utils/AppError");
const validate = (schema, source = 'body') => (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const messages = result.error.issues.map((e) => `${e.path?.join('.') || ''}: ${e.message}`).join('; ');
        return next(new AppError_1.AppError(400, messages, 'VALIDATION_ERROR'));
    }
    req[source] = result.data;
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map