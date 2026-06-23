'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as divisionsApi from './divisions.api';

export function useDivisions(params: divisionsApi.ListDivisionsParams) {
  return useQuery({
    queryKey: ['divisions', params],
    queryFn: () => divisionsApi.listDivisions(params),
  });
}

function invalidateDivisionRelatedQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: ['divisions'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreateDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: divisionsApi.createDivision,
    onSuccess: () => invalidateDivisionRelatedQueries(queryClient),
  });
}

export function useUpdateDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof divisionsApi.updateDivision>[1] }) =>
      divisionsApi.updateDivision(id, payload),
    onSuccess: () => invalidateDivisionRelatedQueries(queryClient),
  });
}

export function useDeleteDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: divisionsApi.deleteDivision,
    onSuccess: () => invalidateDivisionRelatedQueries(queryClient),
  });
}
