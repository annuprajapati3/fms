import { z } from 'zod';

export const createRoleSchema = z.object({
  companyId: z.string().uuid().nullable().default(null),
  code: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'Role code must be uppercase letters, numbers, and underscores only'),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  permissionIds: z.array(z.string().uuid()).default([]),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const setRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;

export const roleIdParamSchema = z.object({
  id: z.string().uuid('Invalid role ID'),
});
