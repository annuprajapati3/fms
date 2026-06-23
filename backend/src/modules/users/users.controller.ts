import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { buildPaginationMeta, sendCreated, sendSuccess } from '@/shared/utils/apiResponse';
import * as usersService from './users.service';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortDir: 'asc' | 'desc';
    search?: string;
    companyId?: string;
    status?: string;
  };
  const { users, total } = await usersService.listUsers(query);
  sendSuccess(res, users, 200, buildPaginationMeta(query.page, query.pageSize, total));
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getUserById(req.params.id);
  sendSuccess(res, user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.createUser(req.body);
  sendCreated(res, user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateUser(req.params.id, req.body);
  sendSuccess(res, user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await usersService.deleteUser(req.params.id);
  sendSuccess(res, { message: 'User deactivated successfully' });
});

export const assignCompanies = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.assignCompanies(req.params.id, req.body);
  sendSuccess(res, user);
});

export const assignBranches = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.assignBranches(req.params.id, req.body);
  sendSuccess(res, user);
});

export const assignRoles = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.assignRoles(req.params.id, req.body);
  sendSuccess(res, user);
});
