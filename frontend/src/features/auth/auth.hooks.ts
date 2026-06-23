'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { setAccessToken, clearAccessToken } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import * as authApi from './auth.api';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.loginRequest,
    onSuccess: (result) => {
      setAccessToken(result.accessToken);
      const defaultCompany = result.user.companies[0];
      const defaultBranch = result.user.branches.find((b) => b.companyId === defaultCompany?.id);

      setSession(result.user, {
        companyId: defaultCompany?.id ?? null,
        branchId: defaultBranch?.id ?? null,
        financialYearId: null,
        permissions: [],
        roles: result.user.roles,
      });

      // Redirect immediately - don't make navigation wait on a second
      // network round trip. Permissions are deliberately not embedded in
      // the JWT (a large permission array there is what broke cookie-based
      // auth entirely once a role had enough permissions), so we fetch the
      // real, freshly-resolved list in the background. Permission-gated
      // buttons simply stay hidden for a moment until this resolves.
      authApi
        .fetchCurrentUser()
        .then((me) => setSession(me.user, me.context))
        .catch(() => {
          // Non-fatal: next successful /auth/me call (e.g. on navigation) will catch up.
        });

      if (result.user.mustChangePassword) {
        router.push('/settings/profile?forcePasswordChange=1');
      } else {
        router.push('/dashboard');
      }
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logoutRequest,
    onSettled: () => {
      clearAccessToken();
      clearSession();
      queryClient.clear();
      router.push('/login');
    },
  });
}

export function useCurrentUser(enabled = true) {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const result = await authApi.fetchCurrentUser();
      setSession(result.user, result.context);
      setInitialized(true);
      return result;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: authApi.changePasswordRequest });
}

export function useSelectCompany() {
  const updateContext = useAuthStore((s) => s.updateContext);
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: authApi.selectCompanyRequest,
    onSuccess: (result, companyId) => {
      setAccessToken(result.accessToken);
      updateContext({ companyId, branchId: null, financialYearId: null });
      authApi
        .fetchCurrentUser()
        .then((me) => setSession(me.user, me.context))
        .catch(() => {
          // Non-fatal: context already updated optimistically above.
        });
    },
  });
}

export function useSelectBranch() {
  const setSession = useAuthStore((s) => s.setSession);
  const updateContext = useAuthStore((s) => s.updateContext);

  return useMutation({
    mutationFn: authApi.selectBranchRequest,
    onSuccess: (result, branchId) => {
      setAccessToken(result.accessToken);
      updateContext({ branchId });
      authApi
        .fetchCurrentUser()
        .then((me) => setSession(me.user, me.context))
        .catch(() => {
          // Non-fatal: context already updated optimistically above.
        });
    },
  });
}

export function useSelectFinancialYear() {
  const updateContext = useAuthStore((s) => s.updateContext);

  return useMutation({
    mutationFn: authApi.selectFinancialYearRequest,
    onSuccess: (result, financialYearId) => {
      setAccessToken(result.accessToken);
      updateContext({ financialYearId });
    },
  });
}
