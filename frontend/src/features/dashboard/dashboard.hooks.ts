'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { fetchDashboardSummary } from './dashboard.api';

export function useDashboardSummary() {
  const companyId = useAuthStore((s) => s.context?.companyId);

  return useQuery({
    queryKey: ['dashboard', 'summary', companyId],
    queryFn: () => fetchDashboardSummary(companyId),
    enabled: Boolean(companyId),
  });
}
