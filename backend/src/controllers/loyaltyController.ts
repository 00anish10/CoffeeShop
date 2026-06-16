import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

export const getBalance = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true },
  });

  const transactions = await prisma.loyaltyTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json({ balance: user?.loyaltyPoints || 0, transactions });
};

export const redeem = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { points } = req.body;

  if (!points || points <= 0) {
    throw new AppError(400, 'Invalid points amount', 'VALIDATION_ERROR');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.loyaltyPoints < points) {
    throw new AppError(400, 'Insufficient loyalty points', 'INSUFFICIENT_POINTS');
  }

  const discountAmount = points / 100;

  res.json({
    pointsRedeemed: points,
    discountAmount,
    remainingBalance: (user.loyaltyPoints || 0) - points,
    message: `$${discountAmount.toFixed(2)} discount will be applied to your next order`,
  });
};
