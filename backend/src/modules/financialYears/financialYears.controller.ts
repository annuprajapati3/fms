import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { sendCreated, sendSuccess } from '@/shared/utils/apiResponse';
import { BadRequestError, UnauthorizedError } from '@/shared/errors/AppError';
import * as fyService from './financialYears.service';

export const listFinancialYears = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.query.companyId as string | undefined;
  if (!companyId) throw new BadRequestError('companyId query parameter is required');
  sendSuccess(res, await fyService.listFinancialYears(companyId));
});

export const getFinancialYear = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await fyService.getFinancialYearById(req.params.id));
});

export const createFinancialYear = asyncHandler(async (req: Request, res: Response) => {
  sendCreated(res, await fyService.createFinancialYear(req.body));
});

export const updateFinancialYear = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await fyService.updateFinancialYear(req.params.id, req.body));
});

export const setCurrentFinancialYear = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await fyService.setCurrentFinancialYear(req.params.id));
});

export const lockFinancialYear = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  sendSuccess(res, await fyService.lockFinancialYear(req.params.id, req.user.sub));
});

export const closeFinancialYear = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await fyService.closeFinancialYear(req.params.id));
});
