'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { useAuthStore } from '@/stores/auth-store';
import { getAccessToken } from '@/lib/api-client';

export function useAuthGuard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasToken = typeof window !== 'undefined' && Boolean(getAccessToken());

  const { isLoading, isError } = useCurrentUser(!user);

  useEffect(() => {
    if (!hasToken && !user) {
      router.replace('/login');
      return;
    }
    if (isError) {
      router.replace('/login');
    }
  }, [hasToken, user, isError, router]);

  return { isLoading: !user && isLoading, user };
}
