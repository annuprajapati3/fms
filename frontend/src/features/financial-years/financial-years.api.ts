import { apiClient } from '@/lib/api-client';
import { ApiSuccessResponse, FinancialYear } from '@/types';

export async function listFinancialYears(companyId: string): Promise<FinancialYear[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<FinancialYear[]>>('/financial-years', {
    params: { companyId },
  });
  return data.data;
}

export interface FinancialYearPayload {
  companyId: string;
  code: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export async function createFinancialYear(payload: FinancialYearPayload): Promise<FinancialYear> {
  const { data } = await apiClient.post<ApiSuccessResponse<FinancialYear>>('/financial-years', payload);
  return data.data;
}

export async function setCurrentFinancialYear(id: string): Promise<FinancialYear> {
  const { data } = await apiClient.post<ApiSuccessResponse<FinancialYear>>(`/financial-years/${id}/set-current`);
  return data.data;
}

export async function lockFinancialYear(id: string): Promise<FinancialYear> {
  const { data } = await apiClient.post<ApiSuccessResponse<FinancialYear>>(`/financial-years/${id}/lock`);
  return data.data;
}

export async function closeFinancialYear(id: string): Promise<FinancialYear> {
  const { data } = await apiClient.post<ApiSuccessResponse<FinancialYear>>(`/financial-years/${id}/close`);
  return data.data;
}
