'use client';

import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { extractApiErrorMessage } from '@/lib/api-client';
import { useChangePassword } from '@/features/auth/auth.hooks';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Needs an uppercase letter')
      .regex(/[a-z]/, 'Needs a lowercase letter')
      .regex(/[0-9]/, 'Needs a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ProfileSettingsPage() {
  const searchParams = useSearchParams();
  const forceChange = searchParams.get('forcePasswordChange') === '1';
  const user = useAuthStore((s) => s.user);
  const changePassword = useChangePassword();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = (values: ChangePasswordFormValues) => {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast({ title: 'Password changed', description: 'Please log in again with your new password.' });
          reset();
          router.push('/login');
        },
        onError: (error) => {
          toast({ title: 'Failed to change password', description: extractApiErrorMessage(error), variant: 'destructive' });
        },
      },
    );
  };

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title="Profile Settings"
        description={
          <>
            Signed in as {user?.firstName} {user?.lastName ?? ''} ({user?.email})
          </>
        }
      />

      {forceChange && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 text-sm">
            Your account requires a password change before you can continue.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>Choose a strong password you haven&apos;t used before.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" {...register('currentPassword')} />
              {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...register('newPassword')} />
              {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" isLoading={changePassword.isPending}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
