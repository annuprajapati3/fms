import { z } from 'zod';

export const createFinancialYearSchema = z
  .object({
    companyId: z.string().uuid('Invalid company ID'),
    code: z.string().trim().min(4).max(20), // e.g. "2025-26"
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isCurrent: z.boolean().default(false),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
export type CreateFinancialYearInput = z.infer<typeof createFinancialYearSchema>;

export const updateFinancialYearSchema = z.object({
  code: z.string().trim().min(4).max(20).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(['UPCOMING', 'ACTIVE', 'CLOSED', 'LOCKED']).optional(),
});
export type UpdateFinancialYearInput = z.infer<typeof updateFinancialYearSchema>;

export const financialYearIdParamSchema = z.object({ id: z.string().uuid('Invalid financial year ID') });
