import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

export const getTableByQrCode = async (req: Request, res: Response) => {
  const qrCode = req.params.qrCode as string;

  const table = await prisma.table.findUnique({ where: { qrCode } });

  if (!table || !table.isActive) {
    throw new AppError(404, 'Table not found or inactive', 'NOT_FOUND');
  }

  res.json({ id: table.id, number: table.number });
};
