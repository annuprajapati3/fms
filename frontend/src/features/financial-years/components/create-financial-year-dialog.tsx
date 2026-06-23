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
import { useCreateFinancialYear } from '@/features/financial-years/financial-years.hooks';
import { Plus } from 'lucide-react';

const fySchema = z
  .object({
    code: z.string().min(4, 'e.g. 2025-26').max(20),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
type FYFormValues = z.infer<typeof fySchema>;

export function CreateFinancialYearDialog({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const createFY = useCreateFinancialYear();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FYFormValues>({ resolver: zodResolver(fySchema) });

  const onSubmit = (values: FYFormValues) => {
    createFY.mutate(
      { ...values, companyId, startDate: values.startDate, endDate: values.endDate },
      {
        onSuccess: () => {
          toast({ title: 'Financial year created' });
          reset();
          setOpen(false);
        },
        onError: (error) => {
          toast({ title: 'Failed to create financial year', description: extractApiErrorMessage(error), variant: 'destructive' });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Financial Year
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Financial Year</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" placeholder="2026-27" {...register('code')} />
            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" isLoading={createFY.isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
