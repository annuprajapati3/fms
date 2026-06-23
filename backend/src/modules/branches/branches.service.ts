import { prisma } from '@/config/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors/AppError';
import { PaginationQuery, toSkipTake } from '@/shared/utils/pagination';
import { buildOrderBy } from '@/shared/utils/sorting';
import { CreateBranchInput, UpdateBranchInput } from './branches.validators';

const SORTABLE_COLUMNS = ['name', 'code', 'city', 'createdAt', 'updatedAt', 'isActive'] as const;

export async function listBranches(query: PaginationQuery & { companyId?: string; divisionId?: string }) {
  const { skip, take } = toSkipTake(query);
  const where = {
    deletedAt: null,
    ...(query.companyId ? { companyId: query.companyId } : {}),
    ...(query.divisionId ? { divisionId: query.divisionId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { code: { contains: query.search, mode: 'insensitive' as const } },
            { city: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [branches, total] = await prisma.$transaction([
    prisma.branch.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.sortDir, SORTABLE_COLUMNS, 'createdAt'),
      skip,
      take,
      include: {
        company: { select: { id: true, name: true, code: true } },
        division: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.branch.count({ where }),
  ]);

  return { branches, total };
}

export async function getBranchById(id: string) {
  const branch = await prisma.branch.findFirst({
    where: { id, deletedAt: null },
    include: { company: true, division: true },
  });
  if (!branch) throw new NotFoundError('Branch not found');
  return branch;
}

export async function createBranch(input: CreateBranchInput) {
  const company = await prisma.company.findFirst({ where: { id: input.companyId, deletedAt: null } });
  if (!company) throw new NotFoundError('Company not found');

  if (input.divisionId) {
    const division = await prisma.division.findFirst({
      where: { id: input.divisionId, companyId: input.companyId, deletedAt: null },
    });
    if (!division) throw new BadRequestError('Division does not belong to the specified company');
  }

  const existing = await prisma.branch.findUnique({
    where: { companyId_code: { companyId: input.companyId, code: input.code } },
  });
  if (existing) throw new ConflictError('A branch with this code already exists in this company');

  return prisma.branch.create({ data: input });
}

export async function updateBranch(id: string, input: UpdateBranchInput) {
  const branch = await getBranchById(id);
  const companyId = input.companyId ?? branch.companyId;

  if (input.divisionId) {
    const division = await prisma.division.findFirst({
      where: { id: input.divisionId, companyId, deletedAt: null },
    });
    if (!division) throw new BadRequestError('Division does not belong to the specified company');
  }

  if (input.code) {
    const dup = await prisma.branch.findFirst({ where: { companyId, code: input.code, id: { not: id } } });
    if (dup) throw new ConflictError('A branch with this code already exists in this company');
  }

  return prisma.branch.update({ where: { id }, data: input });
}

export async function deleteBranch(id: string) {
  await getBranchById(id);
  const assignedUsers = await prisma.userBranch.count({ where: { branchId: id } });
  if (assignedUsers > 0) {
    throw new BadRequestError('Cannot delete a branch with assigned users');
  }
  await prisma.branch.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
}
