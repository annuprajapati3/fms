import { apiClient } from '@/lib/api-client';
import { ApiSuccessResponse, Company, PaginatedResult } from '@/types';

export interface ListCompaniesParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}

export async function listCompanies(params: ListCompaniesParams): Promise<PaginatedResult<Company>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Company[]>>('/companies', { params });
  return { data: data.data, meta: data.meta! };
}

export async function getCompany(id: string): Promise<Company> {
  const { data } = await apiClient.get<ApiSuccessResponse<Company>>(`/companies/${id}`);
  return data.data;
}

export interface CompanyPayload {
  code: string;
  name: string;
  legalName?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

export async function createCompany(payload: CompanyPayload): Promise<Company> {
  const { data } = await apiClient.post<ApiSuccessResponse<Company>>('/companies', payload);
  return data.data;
}

export async function updateCompany(id: string, payload: Partial<CompanyPayload> & { isActive?: boolean }): Promise<Company> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Company>>(`/companies/${id}`, payload);
  return data.data;
}

export async function deleteCompany(id: string): Promise<void> {
  await apiClient.delete(`/companies/${id}`);
}
