'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as branchesApi from './branches.api';

export function useBranches(params: branchesApi.ListBranchesParams) {
  return useQuery({
    queryKey: ['branches', params],
    queryFn: () => branchesApi.listBranches(params),
  });
}

function invalidateBranchRelatedQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: ['branches'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: branchesApi.createBranch,
    onSuccess: () => invalidateBranchRelatedQueries(queryClient),
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof branchesApi.updateBranch>[1] }) =>
      branchesApi.updateBranch(id, payload),
    onSuccess: () => invalidateBranchRelatedQueries(queryClient),
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: branchesApi.deleteBranch,
    onSuccess: () => invalidateBranchRelatedQueries(queryClient),
  });
}
