import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/shared/errors/AppError';
import { verifyAccessToken } from '@/shared/utils/token';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken as string;
  }
  return null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    throw new UnauthorizedError('Authentication token missing');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

/**
 * Optional authentication - attaches user if a valid token is present,
 * but does not reject the request if absent or invalid.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next();
  }
  try {
    req.user = verifyAccessToken(token);
  } catch {
    // ignore invalid token in optional mode
  }
  next();
}
