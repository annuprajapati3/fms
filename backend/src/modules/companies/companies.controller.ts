import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { buildPaginationMeta, sendCreated, sendSuccess } from '@/shared/utils/apiResponse';
import * as companiesService from './companies.service';

export const listCompanies = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortDir: 'asc' | 'desc';
    search?: string;
    isActive?: boolean;
  };
  const { companies, total } = await companiesService.listCompanies(query);
  sendSuccess(res, companies, 200, buildPaginationMeta(query.page, query.pageSize, total));
});

export const getCompany = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await companiesService.getCompanyById(req.params.id));
});

export const createCompany = asyncHandler(async (req: Request, res: Response) => {
  sendCreated(res, await companiesService.createCompany(req.body));
});

export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await companiesService.updateCompany(req.params.id, req.body));
});

export const deleteCompany = asyncHandler(async (req: Request, res: Response) => {
  await companiesService.deleteCompany(req.params.id);
  sendSuccess(res, { message: 'Company deactivated successfully' });
});
