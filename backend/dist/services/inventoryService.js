"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAvailability = checkAvailability;
exports.deductStock = deductStock;
exports.restoreStock = restoreStock;
const prisma_1 = require("../lib/prisma");
const AppError_1 = require("../utils/AppError");
async function checkAvailability(items) {
    for (const item of items) {
        const inventory = await prisma_1.prisma.inventory.findUnique({
            where: { productId: item.productId },
        });
        if (inventory && inventory.stockLevel < item.quantity) {
            throw new AppError_1.AppError(409, `Insufficient stock for product ${item.productId}`, 'INSUFFICIENT_STOCK');
        }
    }
}
async function deductStock(items) {
    await prisma_1.prisma.$transaction(items.map((item) => prisma_1.prisma.inventory.update({
        where: { productId: item.productId },
        data: { stockLevel: { decrement: item.quantity } },
    })));
}
async function restoreStock(items) {
    await prisma_1.prisma.$transaction(items.map((item) => prisma_1.prisma.inventory.update({
        where: { productId: item.productId },
        data: { stockLevel: { increment: item.quantity } },
    })));
}
//# sourceMappingURL=inventoryService.js.map