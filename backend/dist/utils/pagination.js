"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePage = parsePage;
function parsePage(query) {
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '12', 10) || 12));
    return {
        skip: (page - 1) * limit,
        take: limit,
        page,
        limit,
    };
}
//# sourceMappingURL=pagination.js.map