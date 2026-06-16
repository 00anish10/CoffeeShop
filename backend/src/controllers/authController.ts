import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  hashPassword,
  comparePassword,
  signTokens,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../services/authService';
import { AppError } from '../utils/AppError';

const REFRESH_COOKIE = 'refreshToken';

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, role: true, loyaltyPoints: true },
  });

  const tokens = await signTokens(user.id, user.email, user.role);

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    accessToken: tokens.accessToken,
    user,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const tokens = await signTokens(user.id, user.email, user.role);

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken: tokens.accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      loyaltyPoints: user.loyaltyPoints,
    },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new AppError(401, 'Refresh token missing', 'TOKEN_MISSING');
  }

  const payload = verifyRefreshToken(token);
  if (!payload) {
    throw new AppError(401, 'Invalid refresh token', 'TOKEN_INVALID');
  }

  const stored = await import('../lib/redis').then((r) => r.redis.get(`refresh:${payload.sub}`));
  if (!stored || stored !== payload.jti) {
    throw new AppError(401, 'Refresh token revoked', 'TOKEN_REVOKED');
  }

  const accessToken = await import('../services/authService').then((a) =>
    a.signTokens(payload.sub, '', 'CUSTOMER')
  );

  const newRefreshJti = await rotateRefreshToken(payload.sub);

  res.cookie(REFRESH_COOKIE, newRefreshJti, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: accessToken.accessToken });
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    const payload = verifyRefreshToken(token);
    if (payload) {
      await revokeRefreshToken(payload.sub);
    }
  }

  res.clearCookie(REFRESH_COOKIE);
  res.status(204).send();
};
