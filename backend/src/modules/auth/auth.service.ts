import { prisma } from '@/config/prisma';
import { env } from '@/config/env';
import { hashPassword, verifyPassword } from '@/shared/utils/password';
import {
  AccessTokenPayload,
  generateOpaqueToken,
  getRefreshTokenExpiry,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/shared/utils/token';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/shared/errors/AppError';
import { AuditAction, Prisma } from '@prisma/client';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

interface LoginContext {
  ip?: string;
  userAgent?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

interface SafeUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  status: string;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  companies: { id: string; code: string; name: string }[];
  branches: { id: string; code: string; name: string; companyId: string }[];
  roles: string[];
}

function toSafeUser(
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    status: string;
    avatarUrl: string | null;
    mustChangePassword: boolean;
    userCompanies: { company: { id: string; code: string; name: string } }[];
    userBranches: { branch: { id: string; code: string; name: string; companyId: string } }[];
    userRoles: { role: { code: string } }[];
  },
): SafeUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status,
    avatarUrl: user.avatarUrl,
    mustChangePassword: user.mustChangePassword,
    companies: user.userCompanies.map((uc) => uc.company),
    branches: user.userBranches.map((ub) => ub.branch),
    roles: user.userRoles.map((ur) => ur.role.code),
  };
}

const userWithRelationsInclude = {
  userCompanies: { include: { company: true } },
  userBranches: { include: { branch: true } },
  userRoles: { include: { role: true } },
};

/**
 * Resolves the effective permission codes for a user within an (optional)
 * company + branch context. Global roles (companyId null on UserRole) always
 * apply; company-scoped roles apply only when the context matches.
 *
 * IMPORTANT: Prisma omits a where-clause field entirely when its value is
 * `undefined` (as opposed to `null`, which is a real filter). That means we
 * must only add the company/branch-scoped OR clauses when a context is
 * actually selected - otherwise `{ companyId: undefined }` would silently
 * match roles from every company, leaking cross-company permissions.
 */
export async function resolvePermissionCodes(
  userId: string,
  companyId: string | null,
  branchId: string | null,
): Promise<{ permissions: string[]; roleCodes: string[] }> {
  const scopedConditions: Prisma.UserRoleWhereInput[] = [{ companyId: null }]; // global roles, e.g. Super Admin

  if (companyId) {
    scopedConditions.push({ companyId, branchId: null });
    if (branchId) {
      scopedConditions.push({ companyId, branchId });
    }
  }

  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      OR: scopedConditions,
    },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  const permissionSet = new Set<string>();
  const roleCodeSet = new Set<string>();

  for (const ur of userRoles) {
    if (!ur.role.isActive) continue;
    roleCodeSet.add(ur.role.code);
    for (const rp of ur.role.rolePermissions) {
      permissionSet.add(rp.permission.code);
    }
  }

  return { permissions: Array.from(permissionSet), roleCodes: Array.from(roleCodeSet) };
}

async function buildAccessTokenPayload(
  userId: string,
  email: string,
  companyId: string | null,
  branchId: string | null,
  financialYearId: string | null,
): Promise<AccessTokenPayload> {
  const { roleCodes } = await resolvePermissionCodes(userId, companyId, branchId);
  return {
    sub: userId,
    email,
    companyId,
    branchId,
    financialYearId,
    roles: roleCodes,
  };
}

async function writeAuditLog(params: {
  companyId?: string | null;
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  description?: string;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      companyId: params.companyId ?? null,
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      description: params.description,
      ip: params.ip,
      userAgent: params.userAgent,
    },
  });
}

export async function login(email: string, password: string, ctx: LoginContext): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: userWithRelationsInclude,
  });

  if (!user || user.deletedAt) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new ForbiddenError(`Account locked. Try again in ${minutesLeft} minute(s).`);
  }

  if (user.status !== 'ACTIVE') {
    throw new ForbiddenError(`Account is ${user.status.toLowerCase()}. Contact your administrator.`);
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    const failedCount = user.failedLoginCount + 1;
    const shouldLock = failedCount >= MAX_FAILED_LOGIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: shouldLock ? 0 : failedCount,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : undefined,
      },
    });

    await writeAuditLog({
      actorId: user.id,
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: user.id,
      description: shouldLock ? 'Account locked after repeated failed login attempts' : 'Failed login attempt',
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    throw new UnauthorizedError('Invalid email or password');
  }

  // Successful login: reset failure counters
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ctx.ip,
    },
  });

  const defaultCompanyId =
    user.defaultCompanyId ?? user.userCompanies[0]?.companyId ?? null;
  const defaultBranchId =
    user.defaultBranchId ?? user.userBranches.find((b) => b.branch.companyId === defaultCompanyId)?.branchId ?? null;

  const currentFY = defaultCompanyId
    ? await prisma.financialYear.findFirst({ where: { companyId: defaultCompanyId, isCurrent: true } })
    : null;

  const accessPayload = await buildAccessTokenPayload(
    user.id,
    user.email,
    defaultCompanyId,
    defaultBranchId,
    currentFY?.id ?? null,
  );

  const accessToken = signAccessToken(accessPayload);
  const { refreshToken, refreshTokenId } = await issueRefreshToken(user.id, ctx);

  await writeAuditLog({
    companyId: defaultCompanyId,
    actorId: user.id,
    action: 'LOGIN',
    entityType: 'User',
    entityId: user.id,
    description: 'User logged in',
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  void refreshTokenId;

  return { accessToken, refreshToken, user: toSafeUser(user) };
}

async function issueRefreshToken(
  userId: string,
  ctx: LoginContext,
): Promise<{ refreshToken: string; refreshTokenId: string }> {
  const tokenId = generateOpaqueToken();
  const refreshToken = signRefreshToken({ sub: userId, tokenId });

  const record = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      userAgent: ctx.userAgent,
      ip: ctx.ip,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { refreshToken, refreshTokenId: record.id };
}

export async function refreshAccessToken(
  refreshToken: string,
  ctx: LoginContext,
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token is no longer valid');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: userWithRelationsInclude,
  });

  if (!user || user.deletedAt || user.status !== 'ACTIVE') {
    throw new UnauthorizedError('User account is not active');
  }

  // Rotate: revoke old, issue new
  const { refreshToken: newRefreshToken, refreshTokenId } = await issueRefreshToken(user.id, ctx);
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedBy: refreshTokenId },
  });

  const defaultCompanyId = user.defaultCompanyId ?? user.userCompanies[0]?.companyId ?? null;
  const defaultBranchId = user.defaultBranchId ?? null;
  const currentFY = defaultCompanyId
    ? await prisma.financialYear.findFirst({ where: { companyId: defaultCompanyId, isCurrent: true } })
    : null;

  const accessPayload = await buildAccessTokenPayload(
    user.id,
    user.email,
    defaultCompanyId,
    defaultBranchId,
    currentFY?.id ?? null,
  );
  const accessToken = signAccessToken(accessPayload);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string, refreshToken: string | undefined, ctx: LoginContext): Promise<void> {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await writeAuditLog({
    actorId: userId,
    action: 'LOGOUT',
    entityType: 'User',
    entityId: userId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function logoutAllSessions(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash, mustChangePassword: false, passwordChangedAt: new Date() },
  });

  await logoutAllSessions(userId);

  await writeAuditLog({
    actorId: userId,
    action: 'PASSWORD_CHANGE',
    entityType: 'User',
    entityId: userId,
  });
}

export async function requestPasswordReset(email: string): Promise<{ token: string } | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always behave the same way externally to avoid leaking which emails exist;
  // caller (controller) should respond with a generic success message regardless.
  if (!user || user.deletedAt) return null;

  const rawToken = generateOpaqueToken();
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 60 * 60_000), // 1 hour
    },
  });

  return { token: rawToken };
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const resetRecord = await prisma.passwordReset.findUnique({ where: { tokenHash } });

  if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }

  const newHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newHash, mustChangePassword: false, passwordChangedAt: new Date() },
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await logoutAllSessions(resetRecord.userId);

  await writeAuditLog({
    actorId: resetRecord.userId,
    action: 'PASSWORD_RESET',
    entityType: 'User',
    entityId: resetRecord.userId,
  });
}

export async function selectCompany(userId: string, companyId: string): Promise<{ accessToken: string }> {
  const membership = await prisma.userCompany.findUnique({
    where: { userId_companyId: { userId, companyId } },
  });

  const isGlobalUser = await prisma.userRole.findFirst({ where: { userId, companyId: null } });

  if (!membership && !isGlobalUser) {
    throw new ForbiddenError('You do not have access to this company');
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const defaultBranch = await prisma.userBranch.findFirst({
    where: { userId, branch: { companyId } },
  });
  const currentFY = await prisma.financialYear.findFirst({ where: { companyId, isCurrent: true } });

  const payload = await buildAccessTokenPayload(
    userId,
    user.email,
    companyId,
    defaultBranch?.branchId ?? null,
    currentFY?.id ?? null,
  );

  return { accessToken: signAccessToken(payload) };
}

export async function selectBranch(
  userId: string,
  companyId: string,
  branchId: string,
): Promise<{ accessToken: string }> {
  const membership = await prisma.userBranch.findUnique({
    where: { userId_branchId: { userId, branchId } },
    include: { branch: true },
  });
  const isGlobalUser = await prisma.userRole.findFirst({ where: { userId, companyId: null } });

  if ((!membership || membership.branch.companyId !== companyId) && !isGlobalUser) {
    throw new ForbiddenError('You do not have access to this branch');
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const currentFY = await prisma.financialYear.findFirst({ where: { companyId, isCurrent: true } });

  const payload = await buildAccessTokenPayload(userId, user.email, companyId, branchId, currentFY?.id ?? null);

  return { accessToken: signAccessToken(payload) };
}

export async function selectFinancialYear(
  userId: string,
  companyId: string,
  branchId: string | null,
  financialYearId: string,
): Promise<{ accessToken: string }> {
  const fy = await prisma.financialYear.findUnique({ where: { id: financialYearId } });
  if (!fy || fy.companyId !== companyId) {
    throw new NotFoundError('Financial year not found for this company');
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const payload = await buildAccessTokenPayload(userId, user.email, companyId, branchId, fy.id);

  return { accessToken: signAccessToken(payload) };
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userWithRelationsInclude,
  });
  if (!user) throw new NotFoundError('User not found');
  return toSafeUser(user);
}

export const __refreshTokenCookieMaxAgeMs = env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
