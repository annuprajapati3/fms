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
import { useCreateDivision, useUpdateDivision } from '@/features/divisions/divisions.hooks';
import { Division } from '@/types';
import { Plus, Pencil } from 'lucide-react';

const divisionSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});
type DivisionFormValues = z.infer<typeof divisionSchema>;

interface DivisionDialogProps {
  companyId: string;
  division?: Division;
}

export function DivisionDialog({ companyId, division }: DivisionDialogProps) {
  const [open, setOpen] = useState(false);
  const createDivision = useCreateDivision();
  const updateDivision = useUpdateDivision();
  const isEdit = Boolean(division);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DivisionFormValues>({
    resolver: zodResolver(divisionSchema),
    defaultValues: division
      ? { code: division.code, name: division.name, description: division.description ?? '' }
      : undefined,
  });

  const onSubmit = (values: DivisionFormValues) => {
    const action = isEdit
      ? updateDivision.mutateAsync({ id: division!.id, payload: values })
      : createDivision.mutateAsync({ ...values, companyId });

    action
      .then(() => {
        toast({ title: isEdit ? 'Division updated' : 'Division created' });
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
            New Division
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Division' : 'Create Division'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Division Code</Label>
            <Input id="code" {...register('code')} />
            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Division Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register('description')} />
          </div>
          <DialogFooter>
            <Button type="submit" isLoading={createDivision.isPending || updateDivision.isPending}>
              {isEdit ? 'Save Changes' : 'Create Division'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
