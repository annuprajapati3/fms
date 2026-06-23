import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { buildPaginationMeta, sendCreated, sendSuccess } from '@/shared/utils/apiResponse';
import * as divisionsService from './divisions.service';

export const listDivisions = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortDir: 'asc' | 'desc';
    search?: string;
    companyId?: string;
  };
  const { divisions, total } = await divisionsService.listDivisions(query);
  sendSuccess(res, divisions, 200, buildPaginationMeta(query.page, query.pageSize, total));
});

export const getDivision = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await divisionsService.getDivisionById(req.params.id));
});

export const createDivision = asyncHandler(async (req: Request, res: Response) => {
  sendCreated(res, await divisionsService.createDivision(req.body));
});

export const updateDivision = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await divisionsService.updateDivision(req.params.id, req.body));
});

export const deleteDivision = asyncHandler(async (req: Request, res: Response) => {
  await divisionsService.deleteDivision(req.params.id);
  sendSuccess(res, { message: 'Division deactivated successfully' });
});
