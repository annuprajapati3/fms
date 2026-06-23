import { z } from 'zod';

export const createCompanySchema = z.object({
  code: z.string().trim().min(1).max(20).toUpperCase(),
  name: z.string().trim().min(1).max(200),
  legalName: z.string().trim().max(200).optional(),
  gstin: z.string().trim().max(20).optional(),
  pan: z.string().trim().max(20).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).default('India'),
  pincode: z.string().trim().max(10).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export const companyIdParamSchema = z.object({ id: z.string().uuid('Invalid company ID') });
