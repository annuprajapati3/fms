import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { buildPaginationMeta, sendCreated, sendSuccess } from '@/shared/utils/apiResponse';
import * as branchesService from './branches.service';

export const listBranches = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortDir: 'asc' | 'desc';
    search?: string;
    companyId?: string;
    divisionId?: string;
  };
  const { branches, total } = await branchesService.listBranches(query);
  sendSuccess(res, branches, 200, buildPaginationMeta(query.page, query.pageSize, total));
});

export const getBranch = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await branchesService.getBranchById(req.params.id));
});

export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  sendCreated(res, await branchesService.createBranch(req.body));
});

export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await branchesService.updateBranch(req.params.id, req.body));
});

export const deleteBranch = asyncHandler(async (req: Request, res: Response) => {
  await branchesService.deleteBranch(req.params.id);
  sendSuccess(res, { message: 'Branch deactivated successfully' });
});
