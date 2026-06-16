import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getProfile = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      loyaltyPoints: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
    return;
  }

  res.json(user);
};

export const updateProfile = async (req: Request, res: Response) => {
  const { name, avatarUrl } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name, avatarUrl },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      loyaltyPoints: true,
      avatarUrl: true,
    },
  });

  res.json(user);
};

export const getUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      loyaltyPoints: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ users });
};
