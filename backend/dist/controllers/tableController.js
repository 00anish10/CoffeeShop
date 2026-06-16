"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTableByQrCode = void 0;
const prisma_1 = require("../lib/prisma");
const AppError_1 = require("../utils/AppError");
const getTableByQrCode = async (req, res) => {
    const qrCode = req.params.qrCode;
    const table = await prisma_1.prisma.table.findUnique({ where: { qrCode } });
    if (!table || !table.isActive) {
        throw new AppError_1.AppError(404, 'Table not found or inactive', 'NOT_FOUND');
    }
    res.json({ id: table.id, number: table.number });
};
exports.getTableByQrCode = getTableByQrCode;
//# sourceMappingURL=tableController.js.map