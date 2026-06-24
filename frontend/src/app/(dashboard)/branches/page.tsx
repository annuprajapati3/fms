'use client';

import { useState } from 'react';
import { Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/shared/search-input';
import { DataPagination } from '@/components/shared/data-pagination';
import { PermissionGate } from '@/components/shared/permission-gate';
import { PageHeader } from '@/components/shared/page-header';
import { useBranches, useDeleteBranch } from '@/features/branches/branches.hooks';
import { BranchDialog } from '@/features/branches/components/branch-dialog';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export default function BranchesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const context = useAuthStore((s) => s.context);
  const companyId = context?.companyId ?? undefined;

  const { data, isLoading } = useBranches({ page, pageSize: 10, search: search || undefined, companyId });
  const deleteBranch = useDeleteBranch();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Deactivate the ${name} branch? This requires no assigned users.`)) return;
    deleteBranch.mutate(id, {
      onSuccess: () => toast({ title: 'Branch deactivated' }),
      onError: (error) => toast({ title: 'Failed to deactivate branch', description: extractApiErrorMessage(error), variant: 'destructive' }),
    });
  };

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">Select a company to view its branches.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Manage branch locations within the selected company"
        action={
          <PermissionGate permission="BRANCH.CREATE">
            <BranchDialog companyId={companyId} />
          </PermissionGate>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Branches</CardTitle>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search branches..." />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No branches found.</TableCell>
                </TableRow>
              ) : (
                data?.data.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-mono text-sm">{branch.code}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {branch.name}
                        {branch.isHeadOffice && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                      </div>
                    </TableCell>
                    <TableCell>{branch.division?.name ?? '—'}</TableCell>
                    <TableCell>{[branch.city, branch.state].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={branch.isActive ? 'success' : 'secondary'}>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <PermissionGate permission="BRANCH.EDIT">
                          <BranchDialog companyId={companyId} branch={branch} />
                        </PermissionGate>
                        <PermissionGate permission="BRANCH.DELETE">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id, branch.name)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {data?.meta && <DataPagination meta={data.meta} onPageChange={setPage} />}
        </CardContent>
      </Card>
    </div>
  );
}
