'use client';

import { useEffect, useState } from 'react';
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
import { useCreateCompany, useUpdateCompany } from '@/features/companies/companies.hooks';
import { Company } from '@/types';
import { Plus, Pencil } from 'lucide-react';

const companySchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required'),
  legalName: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});
type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyDialogProps {
  company?: Company;
}

export function CompanyDialog({ company }: CompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const isEdit = Boolean(company);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: company
      ? {
          code: company.code,
          name: company.name,
          legalName: company.legalName ?? '',
          gstin: company.gstin ?? '',
          pan: company.pan ?? '',
          city: company.city ?? '',
          state: company.state ?? '',
          phone: company.phone ?? '',
          email: company.email ?? '',
        }
      : undefined,
  });

  useEffect(() => {
    if (open && company) reset(company as unknown as CompanyFormValues);
  }, [open, company, reset]);

  const onSubmit = (values: CompanyFormValues) => {
    const payload = { ...values, email: values.email || undefined };

    const action = isEdit
      ? updateCompany.mutateAsync({ id: company!.id, payload })
      : createCompany.mutateAsync(payload);

    action
      .then(() => {
        toast({ title: isEdit ? 'Company updated' : 'Company created' });
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
            New Company
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Company' : 'Create Company'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Company Code</Label>
              <Input id="code" {...register('code')} disabled={isEdit} />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="legalName">Legal Name</Label>
            <Input id="legalName" {...register('legalName')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input id="gstin" {...register('gstin')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input id="pan" {...register('pan')} />
            </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" isLoading={createCompany.isPending || updateCompany.isPending}>
              {isEdit ? 'Save Changes' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
