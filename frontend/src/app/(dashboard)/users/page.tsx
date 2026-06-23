'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/shared/search-input';
import { DataPagination } from '@/components/shared/data-pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { PermissionGate } from '@/components/shared/permission-gate';
import { PageHeader } from '@/components/shared/page-header';
import { useDeleteUser, useUsers } from '@/features/users/users.hooks';
import { CreateUserDialog } from '@/features/users/components/create-user-dialog';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const context = useAuthStore((s) => s.context);

  const { data, isLoading } = useUsers({ page, pageSize: 10, search: search || undefined, companyId: context?.companyId ?? undefined });
  const deleteUser = useDeleteUser();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Deactivate ${name}? They will no longer be able to log in.`)) return;
    deleteUser.mutate(id, {
      onSuccess: () => toast({ title: 'User deactivated' }),
      onError: (error) => toast({ title: 'Failed to deactivate user', description: extractApiErrorMessage(error), variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage user accounts, access, and roles"
        action={
          <PermissionGate permission="USERS.CREATE">
            <CreateUserDialog />
          </PermissionGate>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Users</CardTitle>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, email, code..." />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName ?? ''}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.employeeCode ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.userRoles.map((ur) => (
                          <span key={ur.role.id} className="rounded bg-muted px-2 py-0.5 text-xs">
                            {ur.role.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <PermissionGate permission="USERS.DELETE">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName ?? ''}`)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </PermissionGate>
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
