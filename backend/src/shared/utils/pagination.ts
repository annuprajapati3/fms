import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function toSkipTake(query: Pick<PaginationQuery, 'page' | 'pageSize'>): { skip: number; take: number } {
  return {
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  };
}
