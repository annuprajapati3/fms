import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { buildPaginationMeta, sendCreated, sendSuccess } from '@/shared/utils/apiResponse';
import * as rolesService from './roles.service';

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortDir: 'asc' | 'desc';
    search?: string;
    companyId?: string;
  };
  const { roles, total } = await rolesService.listRoles(query);
  sendSuccess(res, roles, 200, buildPaginationMeta(query.page, query.pageSize, total));
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await rolesService.getRoleById(req.params.id);
  sendSuccess(res, role);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await rolesService.createRole(req.body);
  sendCreated(res, role);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await rolesService.updateRole(req.params.id, req.body);
  sendSuccess(res, role);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  await rolesService.deleteRole(req.params.id);
  sendSuccess(res, { message: 'Role deleted successfully' });
});

export const setRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const role = await rolesService.setRolePermissions(req.params.id, req.body.permissionIds);
  sendSuccess(res, role);
});

export const getPermissionMatrix = asyncHandler(async (req: Request, res: Response) => {
  const matrix = await rolesService.getPermissionMatrixForRole(req.params.id);
  sendSuccess(res, matrix);
});
