'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';
import { useCreateRole } from '@/features/roles/roles.hooks';
import { useAuthStore } from '@/stores/auth-store';
import { Plus } from 'lucide-react';

const roleSchema = z.object({
  code: z
    .string()
    .min(2, 'At least 2 characters')
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'Uppercase letters, numbers, and underscores only'),
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
});
type RoleFormValues = z.infer<typeof roleSchema>;

export function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  const context = useAuthStore((s) => s.context);
  const createRole = useCreateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({ resolver: zodResolver(roleSchema) });

  const onSubmit = (values: RoleFormValues) => {
    createRole.mutate(
      { ...values, companyId: context?.companyId ?? null, permissionIds: [] },
      {
        onSuccess: () => {
          toast({ title: 'Role created', description: 'Configure its permissions from the matrix view.' });
          reset();
          setOpen(false);
        },
        onError: (error) => {
          toast({ title: 'Failed to create role', description: extractApiErrorMessage(error), variant: 'destructive' });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Role Code</Label>
            <Input id="code" placeholder="OPERATIONS_MANAGER" {...register('code')} />
            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input id="name" placeholder="Operations Manager" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register('description')} />
          </div>
          <DialogFooter>
            <Button type="submit" isLoading={createRole.isPending}>
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
