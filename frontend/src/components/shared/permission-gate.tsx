'use client';

import { useAuthStore } from '@/stores/auth-store';

interface PermissionGateProps {
  permission?: string;
  anyOf?: string[];
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Renders children only if the current user holds the required permission(s)
 * or role. Super Admin always passes. Use this to hide action buttons
 * (Create/Edit/Delete/Approve etc.) the user isn't authorized to use -
 * this is a UX convenience only; the backend is the actual enforcement point.
 */
export function PermissionGate({ permission, anyOf, role, fallback = null, children }: PermissionGateProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const hasRole = useAuthStore((s) => s.hasRole);

  let allowed = true;

  if (permission) allowed = allowed && hasPermission(permission);
  if (anyOf && anyOf.length > 0) allowed = allowed && hasAnyPermission(anyOf);
  if (role) allowed = allowed && hasRole(role);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
