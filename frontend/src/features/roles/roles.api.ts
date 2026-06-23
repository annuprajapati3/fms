import { apiClient } from '@/lib/api-client';
import { ApiSuccessResponse, PaginatedResult, PermissionMatrixModule, Role } from '@/types';

export interface ListRolesParams {
  page: number;
  pageSize: number;
  search?: string;
  companyId?: string;
}

export async function listRoles(params: ListRolesParams): Promise<PaginatedResult<Role>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Role[]>>('/roles', { params });
  return { data: data.data, meta: data.meta! };
}

export interface CreateRolePayload {
  companyId: string | null;
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const { data } = await apiClient.post<ApiSuccessResponse<Role>>('/roles', payload);
  return data.data;
}

export async function updateRole(id: string, payload: { name?: string; description?: string; isActive?: boolean }): Promise<Role> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Role>>(`/roles/${id}`, payload);
  return data.data;
}

export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete(`/roles/${id}`);
}

export async function getPermissionMatrix(roleId: string): Promise<PermissionMatrixModule[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<PermissionMatrixModule[]>>(`/roles/${roleId}/permission-matrix`);
  return data.data;
}

export async function setRolePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
  const { data } = await apiClient.put<ApiSuccessResponse<Role>>(`/roles/${roleId}/permissions`, { permissionIds });
  return data.data;
}
