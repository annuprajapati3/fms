import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '@/config/env';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  companyId: string | null;
  branchId: string | null;
  financialYearId: string | null;
  roles: string[]; // role codes only - small and stable; permissions are resolved server-side per request
}

export interface RefreshTokenPayload {
  sub: string; // userId
  tokenId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = { expiresIn: `${env.JWT_REFRESH_EXPIRES_IN_DAYS}d` as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function getRefreshTokenExpiry(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + env.JWT_REFRESH_EXPIRES_IN_DAYS);
  return expires;
}
