import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';
import { logger } from '@/config/logger';
import { isProduction } from '@/config/env';
import { ApiErrorBody } from '@/shared/utils/apiResponse';

export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiErrorBody = {
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  };
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.requestId }, err.message);
    }
    const body: ApiErrorBody = {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const body: ApiErrorBody = {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: err.flatten() },
    };
    res.status(422).json(body);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    res.status(mapped.statusCode).json({
      success: false,
      error: { code: mapped.code, message: mapped.message },
    } as ApiErrorBody);
    return;
  }

  logger.error({ err, requestId: req.requestId }, 'Unhandled error');

  const body: ApiErrorBody = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred' : (err as Error)?.message ?? 'Unknown error',
    },
  };
  res.status(500).json(body);
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  code: string;
  message: string;
} {
  switch (err.code) {
    case 'P2002':
      return { statusCode: 409, code: 'DUPLICATE_ENTRY', message: 'A record with these values already exists' };
    case 'P2003':
      return { statusCode: 409, code: 'FOREIGN_KEY_CONSTRAINT', message: 'Referenced record does not exist' };
    case 'P2025':
      return { statusCode: 404, code: 'NOT_FOUND', message: 'Record not found' };
    default:
      return { statusCode: 500, code: 'DATABASE_ERROR', message: 'A database error occurred' };
  }
}
