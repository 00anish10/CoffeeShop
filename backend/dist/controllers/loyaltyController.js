"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeem = exports.getBalance = void 0;
const prisma_1 = require("../lib/prisma");
const AppError_1 = require("../utils/AppError");
const getBalance = async (req, res) => {
    const userId = req.user.id;
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
    });
    const transactions = await prisma_1.prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });
    res.json({ balance: user?.loyaltyPoints || 0, transactions });
};
exports.getBalance = getBalance;
const redeem = async (req, res) => {
    const userId = req.user.id;
    const { points } = req.body;
    if (!points || points <= 0) {
        throw new AppError_1.AppError(400, 'Invalid points amount', 'VALIDATION_ERROR');
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.loyaltyPoints < points) {
        throw new AppError_1.AppError(400, 'Insufficient loyalty points', 'INSUFFICIENT_POINTS');
    }
    const discountAmount = points / 100;
    res.json({
        pointsRedeemed: points,
        discountAmount,
        remainingBalance: (user.loyaltyPoints || 0) - points,
        message: `$${discountAmount.toFixed(2)} discount will be applied to your next order`,
    });
};
exports.redeem = redeem;
//# sourceMappingURL=loyaltyController.js.map