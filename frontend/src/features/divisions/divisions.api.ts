import { apiClient } from '@/lib/api-client';
import { ApiSuccessResponse, Division, PaginatedResult } from '@/types';

export interface ListDivisionsParams {
  page: number;
  pageSize: number;
  search?: string;
  companyId?: string;
}

export async function listDivisions(params: ListDivisionsParams): Promise<PaginatedResult<Division>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Division[]>>('/divisions', { params });
  return { data: data.data, meta: data.meta! };
}

export interface DivisionPayload {
  companyId: string;
  code: string;
  name: string;
  description?: string;
}

export async function createDivision(payload: DivisionPayload): Promise<Division> {
  const { data } = await apiClient.post<ApiSuccessResponse<Division>>('/divisions', payload);
  return data.data;
}

export async function updateDivision(
  id: string,
  payload: Partial<Omit<DivisionPayload, 'companyId'>> & { isActive?: boolean },
): Promise<Division> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Division>>(`/divisions/${id}`, payload);
  return data.data;
}

export async function deleteDivision(id: string): Promise<void> {
  await apiClient.delete(`/divisions/${id}`);
}
