'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as rolesApi from './roles.api';

export function useRoles(params: rolesApi.ListRolesParams) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => rolesApi.listRoles(params),
  });
}

export function usePermissionMatrix(roleId: string | undefined) {
  return useQuery({
    queryKey: ['roles', roleId, 'permission-matrix'],
    queryFn: () => rolesApi.getPermissionMatrix(roleId as string),
    enabled: Boolean(roleId),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof rolesApi.updateRole>[1] }) =>
      rolesApi.updateRole(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesApi.setRolePermissions(roleId, permissionIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId, 'permission-matrix'] });
    },
  });
}
