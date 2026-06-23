'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as usersApi from './users.api';

export function useUsers(params: usersApi.ListUsersParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.listUsers(params),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUser(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: usersApi.UpdateUserPayload }) =>
      usersApi.updateUser(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useAssignUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleAssignments }: { id: string; roleAssignments: Parameters<typeof usersApi.assignUserRoles>[1] }) =>
      usersApi.assignUserRoles(id, roleAssignments),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
