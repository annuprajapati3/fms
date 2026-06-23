'use client';

import { Fragment, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';
import { usePermissionMatrix, useSetRolePermissions } from '@/features/roles/roles.hooks';
import { Role } from '@/types';
import { ShieldCheck } from 'lucide-react';

const ALL_ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT', 'PRINT'] as const;

interface PermissionMatrixDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PermissionMatrixDialog({ role, open, onOpenChange }: PermissionMatrixDialogProps) {
  const { data: modules, isLoading } = usePermissionMatrix(open ? role.id : undefined);
  const setPermissions = useSetRolePermissions();

  // grantedIds is the local editable state, seeded from the server response each time it loads.
  const [grantedIds, setGrantedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!modules) return;
    const initial = new Set<string>();
    for (const mod of modules) {
      for (const perm of mod.permissions) {
        if (perm.granted) initial.add(perm.id);
      }
      for (const child of mod.children) {
        for (const perm of child.permissions) {
          if (perm.granted) initial.add(perm.id);
        }
      }
    }
    setGrantedIds(initial);
  }, [modules]);

  const toggle = (permissionId: string, checked: boolean) => {
    setGrantedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permissionId);
      else next.delete(permissionId);
      return next;
    });
  };

  const handleSave = () => {
    setPermissions.mutate(
      { roleId: role.id, permissionIds: Array.from(grantedIds) },
      {
        onSuccess: () => {
          toast({ title: 'Permissions updated', description: `${role.name} permissions have been saved.` });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({ title: 'Failed to update permissions', description: extractApiErrorMessage(error), variant: 'destructive' });
        },
      },
    );
  };

  function renderRow(label: string, code: string, permissions: { id: string; action: string }[], indent = false) {
    const permsByAction = new Map(permissions.map((p) => [p.action, p.id]));
    return (
      <TableRow key={code}>
        <TableCell className={indent ? 'pl-8 text-sm text-muted-foreground' : 'font-medium'}>{label}</TableCell>
        {ALL_ACTIONS.map((action) => {
          const permissionId = permsByAction.get(action);
          if (!permissionId) {
            return <TableCell key={action} className="text-center text-muted-foreground">—</TableCell>;
          }
          return (
            <TableCell key={action} className="text-center">
              <Checkbox
                checked={grantedIds.has(permissionId)}
                onCheckedChange={(checked) => toggle(permissionId, checked === true)}
                disabled={role.isSystem}
              />
            </TableCell>
          );
        })}
      </TableRow>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Permission Matrix — {role.name}
          </DialogTitle>
        </DialogHeader>

        {role.isSystem && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            This is a system role and its permissions cannot be modified.
          </p>
        )}

        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                {ALL_ACTIONS.map((action) => (
                  <TableHead key={action} className="text-center">
                    {action}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={ALL_ACTIONS.length + 1} className="text-center text-muted-foreground">
                    Loading permission matrix...
                  </TableCell>
                </TableRow>
              ) : (
                modules?.map((mod) => (
                  <Fragment key={mod.id}>
                    {renderRow(mod.name, mod.code, mod.permissions)}
                    {mod.children.map((child) => renderRow(child.name, child.code, child.permissions, true))}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!role.isSystem && (
            <Button onClick={handleSave} isLoading={setPermissions.isPending}>
              Save Permissions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
