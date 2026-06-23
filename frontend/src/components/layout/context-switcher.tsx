'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth-store';
import { useSelectBranch, useSelectCompany } from '@/features/auth/auth.hooks';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';

export function ContextSwitcher() {
  const user = useAuthStore((s) => s.user);
  const context = useAuthStore((s) => s.context);
  const selectCompany = useSelectCompany();
  const selectBranch = useSelectBranch();

  if (!user) return null;

  const branchesForCompany = user.branches.filter((b) => b.companyId === context?.companyId);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={context?.companyId ?? undefined}
        onValueChange={(companyId) =>
          selectCompany.mutate(companyId, {
            onError: (error) =>
              toast({ title: 'Could not switch company', description: extractApiErrorMessage(error), variant: 'destructive' }),
          })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent>
          {user.companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={context?.branchId ?? undefined}
        onValueChange={(branchId) =>
          selectBranch.mutate(branchId, {
            onError: (error) =>
              toast({ title: 'Could not switch branch', description: extractApiErrorMessage(error), variant: 'destructive' }),
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>
        <SelectContent>
          {branchesForCompany.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
