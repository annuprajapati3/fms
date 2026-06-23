import { apiClient } from '@/lib/api-client';
import { ApiSuccessResponse, DashboardSummary } from '@/types';

export async function fetchDashboardSummary(companyId?: string | null): Promise<DashboardSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<DashboardSummary>>('/dashboard/summary', {
    params: companyId ? { companyId } : undefined,
  });
  return data.data;
}
