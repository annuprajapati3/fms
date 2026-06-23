'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as companiesApi from './companies.api';

export function useCompanies(params: companiesApi.ListCompaniesParams) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => companiesApi.listCompanies(params),
  });
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => companiesApi.getCompany(id as string),
    enabled: Boolean(id),
  });
}

function invalidateCompanyRelatedQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: ['companies'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.createCompany,
    onSuccess: () => invalidateCompanyRelatedQueries(queryClient),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<companiesApi.CompanyPayload> & { isActive?: boolean } }) =>
      companiesApi.updateCompany(id, payload),
    onSuccess: () => invalidateCompanyRelatedQueries(queryClient),
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.deleteCompany,
    onSuccess: () => invalidateCompanyRelatedQueries(queryClient),
  });
}
