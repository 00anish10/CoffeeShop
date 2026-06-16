"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.awardPoints = awardPoints;
exports.redeemPoints = redeemPoints;
const prisma_1 = require("../lib/prisma");
async function awardPoints(userId, orderId, totalAmount) {
    const isWeekend = [0, 6].includes(new Date().getDay());
    const multiplier = isWeekend ? 2 : 1;
    const points = Math.floor(totalAmount) * multiplier;
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.user.update({
            where: { id: userId },
            data: { loyaltyPoints: { increment: points } },
        }),
        prisma_1.prisma.loyaltyTransaction.create({
            data: {
                userId,
                orderId,
                points,
                type: 'EARNED',
                description: `${points} points earned for order ${orderId}${isWeekend ? ' (2x weekend bonus!)' : ''}`,
            },
        }),
        prisma_1.prisma.order.update({
            where: { id: orderId },
            data: { loyaltyPointsEarned: points },
        }),
    ]);
}
async function redeemPoints(userId, orderId, points) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.loyaltyPoints < points) {
        throw new Error('Insufficient loyalty points');
    }
    const discountAmount = points / 100;
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.user.update({
            where: { id: userId },
            data: { loyaltyPoints: { decrement: points } },
        }),
        prisma_1.prisma.loyaltyTransaction.create({
            data: {
                userId,
                orderId,
                points: -points,
                type: 'REDEEMED',
                description: `${points} points redeemed for $${discountAmount.toFixed(2)} discount`,
            },
        }),
    ]);
    return discountAmount;
}
//# sourceMappingURL=loyaltyService.js.map