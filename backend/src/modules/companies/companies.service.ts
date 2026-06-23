import { prisma } from '@/config/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors/AppError';
import { PaginationQuery, toSkipTake } from '@/shared/utils/pagination';
import { buildOrderBy } from '@/shared/utils/sorting';
import { CreateCompanyInput, UpdateCompanyInput } from './companies.validators';

const SORTABLE_COLUMNS = ['name', 'code', 'createdAt', 'updatedAt', 'isActive'] as const;

export async function listCompanies(query: PaginationQuery & { isActive?: boolean }) {
  const { skip, take } = toSkipTake(query);
  const where = {
    deletedAt: null,
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { code: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [companies, total] = await prisma.$transaction([
    prisma.company.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.sortDir, SORTABLE_COLUMNS, 'createdAt'),
      skip,
      take,
      include: { _count: { select: { divisions: true, branches: true } } },
    }),
    prisma.company.count({ where }),
  ]);

  return { companies, total };
}

export async function getCompanyById(id: string) {
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
    include: { divisions: true, branches: true, financialYears: { orderBy: { startDate: 'desc' } } },
  });
  if (!company) throw new NotFoundError('Company not found');
  return company;
}

export async function createCompany(input: CreateCompanyInput) {
  const existing = await prisma.company.findUnique({ where: { code: input.code } });
  if (existing) throw new ConflictError('A company with this code already exists');
  return prisma.company.create({ data: input });
}

export async function updateCompany(id: string, input: UpdateCompanyInput) {
  await getCompanyById(id);
  if (input.code) {
    const dup = await prisma.company.findFirst({ where: { code: input.code, id: { not: id } } });
    if (dup) throw new ConflictError('A company with this code already exists');
  }
  return prisma.company.update({ where: { id }, data: input });
}

export async function deleteCompany(id: string) {
  await getCompanyById(id);
  const [branchCount, userCount] = await Promise.all([
    prisma.branch.count({ where: { companyId: id, deletedAt: null } }),
    prisma.userCompany.count({ where: { companyId: id } }),
  ]);
  if (branchCount > 0 || userCount > 0) {
    throw new BadRequestError('Cannot delete a company with active branches or assigned users');
  }
  await prisma.company.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
}
