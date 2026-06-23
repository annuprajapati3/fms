import bcrypt from 'bcryptjs';
import { env } from '@/config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const PASSWORD_MIN_LENGTH = 8;

export function isPasswordStrong(password: string): { valid: boolean; reason?: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, reason: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number' };
  }
  return { valid: true };
}
