import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';

export const requireRole = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
  }
  next();
};
