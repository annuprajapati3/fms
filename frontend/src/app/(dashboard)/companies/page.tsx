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
import { useCompanies, useDeleteCompany } from '@/features/companies/companies.hooks';
import { CompanyDialog } from '@/features/companies/components/company-dialog';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useCompanies({ page, pageSize: 10, search: search || undefined });
  const deleteCompany = useDeleteCompany();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Deactivate ${name}? This requires no active branches or assigned users.`)) return;
    deleteCompany.mutate(id, {
      onSuccess: () => toast({ title: 'Company deactivated' }),
      onError: (error) => toast({ title: 'Failed to deactivate company', description: extractApiErrorMessage(error), variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage organization-level companies (multi-company isolation)"
        action={
          <PermissionGate role="SUPER_ADMIN">
            <CompanyDialog />
          </PermissionGate>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Companies</CardTitle>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search companies..." />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Divisions</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">No companies found.</TableCell>
                </TableRow>
              ) : (
                data?.data.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-mono text-sm">{company.code}</TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{[company.city, company.state].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell>{company._count?.divisions ?? 0}</TableCell>
                    <TableCell>{company._count?.branches ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={company.isActive ? 'success' : 'secondary'}>
                        {company.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <PermissionGate permission="COMPANY.EDIT">
                          <CompanyDialog company={company} />
                        </PermissionGate>
                        <PermissionGate role="SUPER_ADMIN">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id, company.name)}>
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
