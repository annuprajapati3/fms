import { prisma } from '@/config/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors/AppError';
import { PaginationQuery, toSkipTake } from '@/shared/utils/pagination';
import { buildOrderBy } from '@/shared/utils/sorting';
import { CreateDivisionInput, UpdateDivisionInput } from './divisions.validators';

const SORTABLE_COLUMNS = ['name', 'code', 'createdAt', 'updatedAt', 'isActive'] as const;

export async function listDivisions(query: PaginationQuery & { companyId?: string }) {
  const { skip, take } = toSkipTake(query);
  const where = {
    deletedAt: null,
    ...(query.companyId ? { companyId: query.companyId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { code: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [divisions, total] = await prisma.$transaction([
    prisma.division.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.sortDir, SORTABLE_COLUMNS, 'createdAt'),
      skip,
      take,
      include: { company: { select: { id: true, name: true, code: true } }, _count: { select: { branches: true } } },
    }),
    prisma.division.count({ where }),
  ]);

  return { divisions, total };
}

export async function getDivisionById(id: string) {
  const division = await prisma.division.findFirst({
    where: { id, deletedAt: null },
    include: { company: true, branches: true },
  });
  if (!division) throw new NotFoundError('Division not found');
  return division;
}

export async function createDivision(input: CreateDivisionInput) {
  const company = await prisma.company.findFirst({ where: { id: input.companyId, deletedAt: null } });
  if (!company) throw new NotFoundError('Company not found');

  const existing = await prisma.division.findUnique({
    where: { companyId_code: { companyId: input.companyId, code: input.code } },
  });
  if (existing) throw new ConflictError('A division with this code already exists in this company');

  return prisma.division.create({ data: input });
}

export async function updateDivision(id: string, input: UpdateDivisionInput) {
  const division = await getDivisionById(id);
  if (input.code) {
    const dup = await prisma.division.findFirst({
      where: { companyId: division.companyId, code: input.code, id: { not: id } },
    });
    if (dup) throw new ConflictError('A division with this code already exists in this company');
  }
  return prisma.division.update({ where: { id }, data: input });
}

export async function deleteDivision(id: string) {
  await getDivisionById(id);
  const branchCount = await prisma.branch.count({ where: { divisionId: id, deletedAt: null } });
  if (branchCount > 0) {
    throw new BadRequestError('Cannot delete a division with active branches');
  }
  await prisma.division.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
}
