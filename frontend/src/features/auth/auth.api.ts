import { apiClient } from '@/lib/api-client';
import { ApiSuccessResponse, AuthContext, AuthUser } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<LoginResult>>('/auth/login', payload);
  return data.data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export interface MeResult {
  user: AuthUser;
  context: AuthContext;
}

export async function fetchCurrentUser(): Promise<MeResult> {
  const { data } = await apiClient.get<ApiSuccessResponse<MeResult>>('/auth/me');
  return data.data;
}

export async function changePasswordRequest(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  await apiClient.post('/auth/change-password', payload);
}

export async function selectCompanyRequest(companyId: string): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ accessToken: string }>>('/auth/select-company', {
    companyId,
  });
  return data.data;
}

export async function selectBranchRequest(branchId: string): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ accessToken: string }>>('/auth/select-branch', {
    branchId,
  });
  return data.data;
}

export async function selectFinancialYearRequest(financialYearId: string): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ accessToken: string }>>(
    '/auth/select-financial-year',
    { financialYearId },
  );
  return data.data;
}
