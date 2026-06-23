import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain an uppercase letter')
    .regex(/[a-z]/, 'New password must contain a lowercase letter')
    .regex(/[0-9]/, 'New password must contain a number'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain an uppercase letter')
    .regex(/[a-z]/, 'New password must contain a lowercase letter')
    .regex(/[0-9]/, 'New password must contain a number'),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const selectCompanySchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
});
export type SelectCompanyInput = z.infer<typeof selectCompanySchema>;

export const selectBranchSchema = z.object({
  branchId: z.string().uuid('Invalid branch ID'),
});
export type SelectBranchInput = z.infer<typeof selectBranchSchema>;

export const selectFinancialYearSchema = z.object({
  financialYearId: z.string().uuid('Invalid financial year ID'),
});
export type SelectFinancialYearInput = z.infer<typeof selectFinancialYearSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(), // optional: may arrive via cookie instead
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
