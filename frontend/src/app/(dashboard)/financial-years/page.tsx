'use client';

import { format } from 'date-fns';
import { Lock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/shared/permission-gate';
import { PageHeader } from '@/components/shared/page-header';
import {
  useCloseFinancialYear,
  useFinancialYears,
  useLockFinancialYear,
  useSetCurrentFinancialYear,
} from '@/features/financial-years/financial-years.hooks';
import { CreateFinancialYearDialog } from '@/features/financial-years/components/create-financial-year-dialog';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { FinancialYearStatus } from '@/types';

const STATUS_VARIANT: Record<FinancialYearStatus, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  UPCOMING: 'secondary',
  CLOSED: 'warning',
  LOCKED: 'destructive',
};

export default function FinancialYearsPage() {
  const context = useAuthStore((s) => s.context);
  const companyId = context?.companyId;

  const { data: financialYears, isLoading } = useFinancialYears(companyId);
  const setCurrentFY = useSetCurrentFinancialYear();
  const lockFY = useLockFinancialYear();
  const closeFY = useCloseFinancialYear();

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">Select a company to view its financial years.</p>;
  }

  const handleSetCurrent = (id: string) => {
    setCurrentFY.mutate(id, {
      onSuccess: () => toast({ title: 'Financial year set as current' }),
      onError: (error) => toast({ title: 'Failed', description: extractApiErrorMessage(error), variant: 'destructive' }),
    });
  };

  const handleLock = (id: string) => {
    if (!window.confirm('Locking a financial year prevents any further changes. Continue?')) return;
    lockFY.mutate(id, {
      onSuccess: () => toast({ title: 'Financial year locked' }),
      onError: (error) => toast({ title: 'Failed to lock', description: extractApiErrorMessage(error), variant: 'destructive' }),
    });
  };

  const handleClose = (id: string) => {
    closeFY.mutate(id, {
      onSuccess: () => toast({ title: 'Financial year closed' }),
      onError: (error) => toast({ title: 'Failed to close', description: extractApiErrorMessage(error), variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Years"
        description="Manage accounting periods for the selected company"
        action={
          <PermissionGate permission="FINANCIAL_YEAR.CREATE">
            <CreateFinancialYearDialog companyId={companyId} />
          </PermissionGate>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Financial Years</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : financialYears?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No financial years found.</TableCell>
                </TableRow>
              ) : (
                financialYears?.map((fy) => (
                  <TableRow key={fy.id} className={fy.isCurrent ? 'bg-gold/5' : undefined}>
                    <TableCell className={fy.isCurrent ? 'signature-rule relative font-medium' : 'font-medium'}>
                      {fy.code}
                    </TableCell>
                    <TableCell>{format(new Date(fy.startDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{format(new Date(fy.endDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[fy.status]}>{fy.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {fy.isCurrent ? (
                        <CheckCircle2 className="h-4 w-4 text-gold" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!fy.isCurrent && fy.status !== 'LOCKED' && (
                          <PermissionGate permission="FINANCIAL_YEAR.EDIT">
                            <Button variant="outline" size="sm" onClick={() => handleSetCurrent(fy.id)}>
                              Set Current
                            </Button>
                          </PermissionGate>
                        )}
                        {fy.status !== 'LOCKED' && fy.status !== 'CLOSED' && !fy.isCurrent && (
                          <PermissionGate role="SUPER_ADMIN">
                            <Button variant="outline" size="sm" onClick={() => handleClose(fy.id)}>
                              Close
                            </Button>
                          </PermissionGate>
                        )}
                        {fy.status !== 'LOCKED' && (
                          <PermissionGate role="SUPER_ADMIN">
                            <Button variant="ghost" size="icon" onClick={() => handleLock(fy.id)}>
                              <Lock className="h-4 w-4" />
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
        </CardContent>
      </Card>
    </div>
  );
}
