import { prisma } from '../lib/prisma';

export async function awardPoints(userId: string, orderId: string, totalAmount: number): Promise<void> {
  const isWeekend = [0, 6].includes(new Date().getDay());
  const multiplier = isWeekend ? 2 : 1;
  const points = Math.floor(totalAmount) * multiplier;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: points } },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId,
        orderId,
        points,
        type: 'EARNED',
        description: `${points} points earned for order ${orderId}${isWeekend ? ' (2x weekend bonus!)' : ''}`,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { loyaltyPointsEarned: points },
    }),
  ]);
}

export async function redeemPoints(userId: string, orderId: string, points: number): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.loyaltyPoints < points) {
    throw new Error('Insufficient loyalty points');
  }

  const discountAmount = points / 100;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { decrement: points } },
    }),
    prisma.loyaltyTransaction.create({
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
