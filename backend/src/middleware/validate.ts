import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const messages = result.error.issues.map((e: any) => `${e.path?.join('.') || ''}: ${e.message}`).join('; ');
      return next(new AppError(400, messages, 'VALIDATION_ERROR'));
    }
    req[source] = result.data;
    next();
  };
