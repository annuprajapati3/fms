import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '@/shared/errors/AppError';
import { resolvePermissionCodes } from '@/modules/auth/auth.service';
import { asyncHandler } from '@/middlewares/asyncHandler';

const SUPER_ADMIN_ROLE_CODE = 'SUPER_ADMIN';

/**
 * Permissions are deliberately NOT embedded in the JWT (see CHANGELOG: this used
 * to put the full permission array in the token, which made it large enough that
 * browsers silently drop the Set-Cookie header past ~4KB - a real bug that broke
 * login entirely once a role had enough permissions, e.g. Super Admin).
 *
 * Instead we resolve permissions from the DB per request, with a short-lived
 * in-memory cache keyed by user+company+branch so this stays fast without
 * re-introducing the token-bloat problem. Cache entries expire quickly (10s)
 * so permission changes (e.g. editing a role's matrix) take effect almost
 * immediately rather than waiting for a full token refresh cycle.
 */
const PERMISSION_CACHE_TTL_MS = 10_000;
interface CacheEntry {
  permissions: string[];
  roleCodes: string[];
  expiresAt: number;
}
const permissionCache = new Map<string, CacheEntry>();

function cacheKey(userId: string, companyId: string | null, branchId: string | null): string {
  return `${userId}::${companyId ?? '-'}::${branchId ?? '-'}`;
}

async function getResolvedPermissions(
  userId: string,
  companyId: string | null,
  branchId: string | null,
): Promise<{ permissions: string[]; roleCodes: string[] }> {
  const key = cacheKey(userId, companyId, branchId);
  const cached = permissionCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { permissions: cached.permissions, roleCodes: cached.roleCodes };
  }

  const resolved = await resolvePermissionCodes(userId, companyId, branchId);
  permissionCache.set(key, { ...resolved, expiresAt: Date.now() + PERMISSION_CACHE_TTL_MS });
  return resolved;
}

/**
 * Requires the authenticated user to hold ALL of the given permission codes,
 * e.g. "FLEET.VEHICLE.CREATE". Super Admin (by role code on the token) bypasses
 * all checks without needing a DB lookup at all.
 */
export function requirePermission(...permissionCodes: string[]) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.roles.includes(SUPER_ADMIN_ROLE_CODE)) {
      return next();
    }

    const { permissions } = await getResolvedPermissions(req.user.sub, req.user.companyId, req.user.branchId);
    const granted = new Set(permissions);
    const missing = permissionCodes.filter((code) => !granted.has(code));

    if (missing.length > 0) {
      throw new ForbiddenError(`Missing required permission(s): ${missing.join(', ')}`);
    }

    next();
  });
}

/**
 * Requires the user to hold AT LEAST ONE of the given permission codes.
 */
export function requireAnyPermission(...permissionCodes: string[]) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.roles.includes(SUPER_ADMIN_ROLE_CODE)) {
      return next();
    }

    const { permissions } = await getResolvedPermissions(req.user.sub, req.user.companyId, req.user.branchId);
    const granted = new Set(permissions);
    const hasAny = permissionCodes.some((code) => granted.has(code));

    if (!hasAny) {
      throw new ForbiddenError(`Requires one of: ${permissionCodes.join(', ')}`);
    }

    next();
  });
}

/**
 * Requires the user to hold one of the given role codes.
 */
export function requireRole(...roleCodes: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const hasRole = req.user.roles.some((r) => roleCodes.includes(r));
    if (!hasRole) {
      throw new ForbiddenError(`Requires role: ${roleCodes.join(' or ')}`);
    }
    next();
  };
}

/**
 * Ensures the request has an active company context selected
 * (set via /auth/select-company, embedded in the access token).
 */
export function requireCompanyContext(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  if (!req.user.companyId) {
    throw new ForbiddenError('No company selected. Call /auth/select-company first.');
  }
  next();
}
