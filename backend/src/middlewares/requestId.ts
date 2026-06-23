import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  req.requestId = typeof incoming === 'string' ? incoming : uuidv4();
  res.setHeader('x-request-id', req.requestId);
  next();
}
