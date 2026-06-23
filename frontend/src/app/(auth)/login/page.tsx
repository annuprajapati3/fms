'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/features/auth/auth.hooks';
import { extractApiErrorMessage } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, {
      onError: (error) => {
        toast({ title: 'Login failed', description: extractApiErrorMessage(error), variant: 'destructive' });
      },
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4">
      {/* Ambient texture - faint diagonal hairlines evoke a ledger page without being literal */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, white 0, white 1px, transparent 1px, transparent 28px)',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm animate-rise-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-gold shadow-[0_0_0_5px_hsla(40,65%,45%,0.18)]">
            <span className="font-serif text-2xl font-bold leading-none text-gold-foreground">F</span>
          </div>
          <h1 className="font-serif text-xl font-semibold text-primary-foreground">Freight Management System</h1>
          <p className="mt-1 text-sm text-primary-foreground/60">Sign in to your account to continue</p>
        </div>

        <div className="rounded-lg bg-card p-7 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" isLoading={login.isPending}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-primary-foreground/40">
          Enterprise Freight &amp; Fleet Operations
        </p>
      </div>
    </div>
  );
}
