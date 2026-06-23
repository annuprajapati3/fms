'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/shared/search-input';
import { DataPagination } from '@/components/shared/data-pagination';
import { PermissionGate } from '@/components/shared/permission-gate';
import { PageHeader } from '@/components/shared/page-header';
import { useDeleteDivision, useDivisions } from '@/features/divisions/divisions.hooks';
import { DivisionDialog } from '@/features/divisions/components/division-dialog';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export default function DivisionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const context = useAuthStore((s) => s.context);
  const companyId = context?.companyId;

  const { data, isLoading } = useDivisions({ page, pageSize: 10, search: search || undefined, companyId });
  const deleteDivision = useDeleteDivision();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Deactivate the ${name} division? This requires no active branches.`)) return;
    deleteDivision.mutate(id, {
      onSuccess: () => toast({ title: 'Division deactivated' }),
      onError: (error) => toast({ title: 'Failed to deactivate division', description: extractApiErrorMessage(error), variant: 'destructive' }),
    });
  };

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">Select a company to view its divisions.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Divisions"
        description="Manage divisions within the selected company"
        action={
          <PermissionGate permission="DIVISION.CREATE">
            <DivisionDialog companyId={companyId} />
          </PermissionGate>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Divisions</CardTitle>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search divisions..." />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No divisions found.</TableCell>
                </TableRow>
              ) : (
                data?.data.map((division) => (
                  <TableRow key={division.id}>
                    <TableCell className="font-mono text-sm">{division.code}</TableCell>
                    <TableCell className="font-medium">{division.name}</TableCell>
                    <TableCell>{division._count?.branches ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={division.isActive ? 'success' : 'secondary'}>
                        {division.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <PermissionGate permission="DIVISION.EDIT">
                          <DivisionDialog companyId={companyId} division={division} />
                        </PermissionGate>
                        <PermissionGate permission="DIVISION.DELETE">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(division.id, division.name)}>
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
