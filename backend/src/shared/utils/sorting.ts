/**
 * Builds a type-safe Prisma `orderBy` object from a user-supplied sortBy string,
 * restricted to an explicit whitelist of sortable columns per entity. Falls back
 * to the given default column if sortBy is missing or not in the whitelist.
 *
 * This avoids two problems with naive `{ [sortBy]: sortDir }`:
 *  1. TypeScript: Prisma's OrderByInput types don't accept an arbitrary string index,
 *     so dynamic keys fail to type-check against the strict generated types.
 *  2. Safety: an unvalidated client-supplied field name should never be used to
 *     build a query object directly.
 */
export function buildOrderBy<TKey extends string>(
  sortBy: string | undefined,
  sortDir: 'asc' | 'desc',
  allowedColumns: readonly TKey[],
  defaultColumn: TKey,
): Record<TKey, 'asc' | 'desc'> {
  const column = (allowedColumns as readonly string[]).includes(sortBy ?? '') ? (sortBy as TKey) : defaultColumn;
  return { [column]: sortDir } as Record<TKey, 'asc' | 'desc'>;
}
