import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { redis } from '../lib/redis';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signTokens(userId: string, email: string, role: Role): Promise<TokenPair> {
  const payload: TokenPayload = { sub: userId, email, role };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

  const refreshToken = uuidv4();
  const refreshJti = jwt.sign({ jti: refreshToken, sub: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  await redis.set(`refresh:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  return { accessToken, refreshToken: refreshJti };
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { jti: string; sub: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { jti: string; sub: string };
  } catch {
    return null;
  }
}

export async function rotateRefreshToken(userId: string): Promise<string> {
  const newRefreshToken = uuidv4();
  const newRefreshJti = jwt.sign({ jti: newRefreshToken, sub: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  await redis.del(`refresh:${userId}`);
  await redis.set(`refresh:${userId}`, newRefreshToken, 'EX', 7 * 24 * 60 * 60);

  return newRefreshJti;
}

export async function revokeRefreshToken(userId: string): Promise<void> {
  await redis.del(`refresh:${userId}`);
}
