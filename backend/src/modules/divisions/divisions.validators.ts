import { z } from 'zod';

export const createDivisionSchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  code: z.string().trim().min(1).max(20).toUpperCase(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional(),
});
export type CreateDivisionInput = z.infer<typeof createDivisionSchema>;

export const updateDivisionSchema = z.object({
  code: z.string().trim().min(1).max(20).toUpperCase().optional(),
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDivisionInput = z.infer<typeof updateDivisionSchema>;

export const divisionIdParamSchema = z.object({ id: z.string().uuid('Invalid division ID') });
