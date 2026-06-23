import { z } from 'zod';

export const createBranchSchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  divisionId: z.string().uuid('Invalid division ID').nullable().optional(),
  code: z.string().trim().min(1).max(20).toUpperCase(),
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z.string().trim().max(10).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().email().optional(),
  gstin: z.string().trim().max(20).optional(),
  isHeadOffice: z.boolean().default(false),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema.partial().extend({
  companyId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

export const branchIdParamSchema = z.object({ id: z.string().uuid('Invalid branch ID') });
