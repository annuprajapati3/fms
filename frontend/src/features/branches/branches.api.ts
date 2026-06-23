import { apiClient } from '@/lib/api-client';
import { ApiSuccessResponse, Branch, PaginatedResult } from '@/types';

export interface ListBranchesParams {
  page: number;
  pageSize: number;
  search?: string;
  companyId?: string;
  divisionId?: string;
}

export async function listBranches(params: ListBranchesParams): Promise<PaginatedResult<Branch>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Branch[]>>('/branches', { params });
  return { data: data.data, meta: data.meta! };
}

export interface BranchPayload {
  companyId: string;
  divisionId?: string | null;
  code: string;
  name: string;
  type?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  isHeadOffice?: boolean;
}

export async function createBranch(payload: BranchPayload): Promise<Branch> {
  const { data } = await apiClient.post<ApiSuccessResponse<Branch>>('/branches', payload);
  return data.data;
}

export async function updateBranch(
  id: string,
  payload: Partial<Omit<BranchPayload, 'companyId'>> & { isActive?: boolean },
): Promise<Branch> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Branch>>(`/branches/${id}`, payload);
  return data.data;
}

export async function deleteBranch(id: string): Promise<void> {
  await apiClient.delete(`/branches/${id}`);
}
