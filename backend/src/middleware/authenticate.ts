import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { AppError } from '../utils/AppError';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing or malformed authorization header', 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return next(new AppError(401, 'Invalid or expired token', 'TOKEN_EXPIRED'));
  }

  req.user = { id: payload.sub, email: payload.email, role: payload.role };
  next();
};
