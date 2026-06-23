import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { sendSuccess } from '@/shared/utils/apiResponse';
import { UnauthorizedError } from '@/shared/errors/AppError';
import * as authService from './auth.service';

const REFRESH_COOKIE_NAME = 'refreshToken';
const ACCESS_COOKIE_NAME = 'accessToken';

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: maxAgeMs,
    path: '/',
  };
}

function getClientCtx(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password, getClientCtx(req));

  res.cookie(ACCESS_COOKIE_NAME, result.accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions(authService.__refreshTokenCookieMaxAgeMs));

  sendSuccess(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.body.refreshToken ?? req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw new UnauthorizedError('Refresh token missing');

  const result = await authService.refreshAccessToken(token, getClientCtx(req));

  res.cookie(ACCESS_COOKIE_NAME, result.accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions(authService.__refreshTokenCookieMaxAgeMs));

  sendSuccess(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.body.refreshToken ?? req.cookies?.[REFRESH_COOKIE_NAME];
  if (req.user) {
    await authService.logout(req.user.sub, token, getClientCtx(req));
  }
  res.clearCookie(ACCESS_COOKIE_NAME);
  res.clearCookie(REFRESH_COOKIE_NAME);
  sendSuccess(res, { message: 'Logged out successfully' });
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await authService.logoutAllSessions(req.user.sub);
  res.clearCookie(ACCESS_COOKIE_NAME);
  res.clearCookie(REFRESH_COOKIE_NAME);
  sendSuccess(res, { message: 'Logged out from all sessions' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const user = await authService.getCurrentUser(req.user.sub);
  const { permissions, roleCodes } = await authService.resolvePermissionCodes(
    req.user.sub,
    req.user.companyId,
    req.user.branchId,
  );
  sendSuccess(res, {
    user,
    context: {
      companyId: req.user.companyId,
      branchId: req.user.branchId,
      financialYearId: req.user.financialYearId,
      permissions,
      roles: roleCodes,
    },
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.sub, currentPassword, newPassword);
  res.clearCookie(ACCESS_COOKIE_NAME);
  res.clearCookie(REFRESH_COOKIE_NAME);
  sendSuccess(res, { message: 'Password changed successfully. Please log in again.' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.requestPasswordReset(email);

  // TODO: integrate with notification service to email the reset link.
  // Exposed here only for local/dev testing without an email provider configured.
  sendSuccess(res, {
    message: 'If an account exists for this email, a password reset link has been sent.',
    devOnlyToken: process.env.NODE_ENV !== 'production' ? result?.token : undefined,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  sendSuccess(res, { message: 'Password has been reset successfully. Please log in.' });
});

export const selectCompany = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { companyId } = req.body;
  const result = await authService.selectCompany(req.user.sub, companyId);
  res.cookie(ACCESS_COOKIE_NAME, result.accessToken, cookieOptions(15 * 60 * 1000));
  sendSuccess(res, { accessToken: result.accessToken });
});

export const selectBranch = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new UnauthorizedError('Select a company first');
  const { branchId } = req.body;
  const result = await authService.selectBranch(req.user.sub, req.user.companyId, branchId);
  res.cookie(ACCESS_COOKIE_NAME, result.accessToken, cookieOptions(15 * 60 * 1000));
  sendSuccess(res, { accessToken: result.accessToken });
});

export const selectFinancialYear = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new UnauthorizedError('Select a company first');
  const { financialYearId } = req.body;
  const result = await authService.selectFinancialYear(
    req.user.sub,
    req.user.companyId,
    req.user.branchId,
    financialYearId,
  );
  res.cookie(ACCESS_COOKIE_NAME, result.accessToken, cookieOptions(15 * 60 * 1000));
  sendSuccess(res, { accessToken: result.accessToken });
});
