import { z } from 'zod';

export const createUserSchema = z.object({
  employeeCode: z.string().trim().max(50).optional(),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().trim().max(20).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  mustChangePassword: z.boolean().default(true),
  companyIds: z.array(z.string().uuid()).default([]),
  branchIds: z.array(z.string().uuid()).default([]),
  roleAssignments: z
    .array(
      z.object({
        roleId: z.string().uuid(),
        companyId: z.string().uuid().nullable().default(null),
        branchId: z.string().uuid().nullable().default(null),
      }),
    )
    .default([]),
  defaultCompanyId: z.string().uuid().nullable().optional(),
  defaultBranchId: z.string().uuid().nullable().optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  employeeCode: z.string().trim().max(50).nullable().optional(),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().max(100).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  defaultCompanyId: z.string().uuid().nullable().optional(),
  defaultBranchId: z.string().uuid().nullable().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const assignCompaniesSchema = z.object({
  companyIds: z.array(z.string().uuid()).min(0),
});
export type AssignCompaniesInput = z.infer<typeof assignCompaniesSchema>;

export const assignBranchesSchema = z.object({
  branchIds: z.array(z.string().uuid()).min(0),
});
export type AssignBranchesInput = z.infer<typeof assignBranchesSchema>;

export const assignRolesSchema = z.object({
  roleAssignments: z.array(
    z.object({
      roleId: z.string().uuid(),
      companyId: z.string().uuid().nullable().default(null),
      branchId: z.string().uuid().nullable().default(null),
    }),
  ),
});
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export const adminResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  forceChangeOnNextLogin: z.boolean().default(true),
});
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
