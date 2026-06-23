'use client';

import { useState } from 'react';
import { ShieldCheck, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/shared/search-input';
import { DataPagination } from '@/components/shared/data-pagination';
import { PermissionGate } from '@/components/shared/permission-gate';
import { PageHeader } from '@/components/shared/page-header';
import { useDeleteRole, useRoles } from '@/features/roles/roles.hooks';
import { CreateRoleDialog } from '@/features/roles/components/create-role-dialog';
import { PermissionMatrixDialog } from '@/features/roles/components/permission-matrix-dialog';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@/types';

export default function RolesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [matrixRole, setMatrixRole] = useState<Role | null>(null);
  const context = useAuthStore((s) => s.context);

  const { data, isLoading } = useRoles({ page, pageSize: 10, search: search || undefined, companyId: context?.companyId ?? undefined });
  const deleteRole = useDeleteRole();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete the ${name} role? This requires no assigned users.`)) return;
    deleteRole.mutate(id, {
      onSuccess: () => toast({ title: 'Role deleted' }),
      onError: (error) => toast({ title: 'Failed to delete role', description: extractApiErrorMessage(error), variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Define roles and configure their module-level permission matrix"
        action={
          <PermissionGate permission="ROLES.CREATE">
            <CreateRoleDialog />
          </PermissionGate>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Roles</CardTitle>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search roles..." />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Permissions Granted</TableHead>
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No roles found.</TableCell>
                </TableRow>
              ) : (
                data?.data.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono text-sm">{role.code}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.name}
                        {role.isSystem && <Badge variant="outline">System</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{role.companyId ? 'Company-scoped' : 'Global'}</TableCell>
                    <TableCell>{role.rolePermissions.length}</TableCell>
                    <TableCell>
                      <Badge variant={role.isActive ? 'success' : 'secondary'}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <PermissionGate permission="ROLES.VIEW">
                          <Button variant="ghost" size="icon" onClick={() => setMatrixRole(role)}>
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        {!role.isSystem && (
                          <PermissionGate permission="ROLES.DELETE">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id, role.name)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </PermissionGate>
                        )}
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

      {matrixRole && (
        <PermissionMatrixDialog
          role={matrixRole}
          open={Boolean(matrixRole)}
          onOpenChange={(open) => !open && setMatrixRole(null)}
        />
      )}
    </div>
  );
}
