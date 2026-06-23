import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { buildPaginationMeta, sendSuccess } from '@/shared/utils/apiResponse';
import * as dashboardService from './dashboard.service';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string | undefined) ?? req.user?.companyId ?? null;
  if (companyId) {
    await dashboardService.ensureCompanyExists(companyId);
  }
  const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN') ?? false;
  const summary = await dashboardService.getDashboardSummary(companyId, isSuperAdmin);
  sendSuccess(res, summary);
});

export const getAuditTrail = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    page: number;
    pageSize: number;
    companyId?: string;
    entityType?: string;
    actorId?: string;
  };
  const skip = (query.page - 1) * query.pageSize;
  const { logs, total } = await dashboardService.getAuditTrail({
    companyId: query.companyId,
    entityType: query.entityType,
    actorId: query.actorId,
    skip,
    take: query.pageSize,
  });
  sendSuccess(res, logs, 200, buildPaginationMeta(query.page, query.pageSize, total));
});
