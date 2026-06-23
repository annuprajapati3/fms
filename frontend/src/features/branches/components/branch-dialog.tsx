'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';
import { useCreateBranch, useUpdateBranch } from '@/features/branches/branches.hooks';
import { useDivisions } from '@/features/divisions/divisions.hooks';
import { Branch } from '@/types';
import { Plus, Pencil } from 'lucide-react';

const branchSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required'),
  divisionId: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  isHeadOffice: z.boolean().default(false),
});
type BranchFormValues = z.infer<typeof branchSchema>;

interface BranchDialogProps {
  companyId: string;
  branch?: Branch;
}

export function BranchDialog({ companyId, branch }: BranchDialogProps) {
  const [open, setOpen] = useState(false);
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const isEdit = Boolean(branch);

  const { data: divisionsResult } = useDivisions({ page: 1, pageSize: 100, companyId });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: branch
      ? {
          code: branch.code,
          name: branch.name,
          divisionId: branch.divisionId ?? undefined,
          city: branch.city ?? '',
          state: branch.state ?? '',
          phone: branch.phone ?? '',
          isHeadOffice: branch.isHeadOffice,
        }
      : { isHeadOffice: false },
  });

  const onSubmit = (values: BranchFormValues) => {
    const action = isEdit
      ? updateBranch.mutateAsync({ id: branch!.id, payload: values })
      : createBranch.mutateAsync({ ...values, companyId });

    action
      .then(() => {
        toast({ title: isEdit ? 'Branch updated' : 'Branch created' });
        setOpen(false);
        if (!isEdit) reset();
      })
      .catch((error) => {
        toast({ title: 'Operation failed', description: extractApiErrorMessage(error), variant: 'destructive' });
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            New Branch
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Branch' : 'Create Branch'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Branch Code</Label>
              <Input id="code" {...register('code')} />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Branch Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Division</Label>
            <Controller
              control={control}
              name="divisionId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select division (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisionsResult?.data.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register('state')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isHeadOffice"
              render={({ field }) => (
                <Checkbox id="isHeadOffice" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="isHeadOffice" className="cursor-pointer">
              This is the Head Office
            </Label>
          </div>

          <DialogFooter>
            <Button type="submit" isLoading={createBranch.isPending || updateBranch.isPending}>
              {isEdit ? 'Save Changes' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
