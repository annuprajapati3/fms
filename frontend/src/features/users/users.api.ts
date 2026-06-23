import { apiClient } from '@/lib/api-client';
import { ApiSuccessResponse, PaginatedResult, User } from '@/types';

export interface ListUsersParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  companyId?: string;
}

export async function listUsers(params: ListUsersParams): Promise<PaginatedResult<User>> {
  const { data } = await apiClient.get<ApiSuccessResponse<User[]>>('/users', { params });
  return { data: data.data, meta: data.meta! };
}

export async function getUser(id: string): Promise<User> {
  const { data } = await apiClient.get<ApiSuccessResponse<User>>(`/users/${id}`);
  return data.data;
}

export interface CreateUserPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  employeeCode?: string;
  mustChangePassword: boolean;
  companyIds: string[];
  branchIds: string[];
  roleAssignments: { roleId: string; companyId: string | null; branchId: string | null }[];
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await apiClient.post<ApiSuccessResponse<User>>('/users', payload);
  return data.data;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string | null;
  phone?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await apiClient.patch<ApiSuccessResponse<User>>(`/users/${id}`, payload);
  return data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

export async function assignUserRoles(
  id: string,
  roleAssignments: { roleId: string; companyId: string | null; branchId: string | null }[],
): Promise<User> {
  const { data } = await apiClient.put<ApiSuccessResponse<User>>(`/users/${id}/roles`, { roleAssignments });
  return data.data;
}
