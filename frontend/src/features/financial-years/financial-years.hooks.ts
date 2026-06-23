'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as fyApi from './financial-years.api';

export function useFinancialYears(companyId: string | undefined) {
  return useQuery({
    queryKey: ['financial-years', companyId],
    queryFn: () => fyApi.listFinancialYears(companyId as string),
    enabled: Boolean(companyId),
  });
}

function invalidateFYRelatedQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: ['financial-years'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreateFinancialYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fyApi.createFinancialYear,
    onSuccess: () => invalidateFYRelatedQueries(queryClient),
  });
}

export function useSetCurrentFinancialYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fyApi.setCurrentFinancialYear,
    onSuccess: () => invalidateFYRelatedQueries(queryClient),
  });
}

export function useLockFinancialYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fyApi.lockFinancialYear,
    onSuccess: () => invalidateFYRelatedQueries(queryClient),
  });
}

export function useCloseFinancialYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fyApi.closeFinancialYear,
    onSuccess: () => invalidateFYRelatedQueries(queryClient),
  });
}
