import { Prisma, UserStatus } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { buildOrderBy } from '@/shared/utils/sorting';

const USER_SORTABLE_COLUMNS = ['firstName', 'lastName', 'email', 'employeeCode', 'createdAt', 'status'] as const;

export const userListInclude = {
  userCompanies: { include: { company: { select: { id: true, code: true, name: true } } } },
  userBranches: { include: { branch: { select: { id: true, code: true, name: true, companyId: true } } } },
  userRoles: { include: { role: { select: { id: true, code: true, name: true } } } },
} satisfies Prisma.UserInclude;

export function findById(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: userListInclude,
  });
}

export function findByEmail(email: string) {
  return prisma.user.findFirst({ where: { email, deletedAt: null } });
}

export function findManyPaginated(params: {
  skip: number;
  take: number;
  search?: string;
  companyId?: string;
  status?: string;
  sortBy?: string;
  sortDir: 'asc' | 'desc';
}) {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(params.status ? { status: params.status as UserStatus } : {}),
    ...(params.companyId ? { userCompanies: { some: { companyId: params.companyId } } } : {}),
    ...(params.search
      ? {
          OR: [
            { firstName: { contains: params.search, mode: 'insensitive' } },
            { lastName: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
            { employeeCode: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.UserOrderByWithRelationInput = buildOrderBy(
    params.sortBy,
    params.sortDir,
    USER_SORTABLE_COLUMNS,
    'createdAt',
  );

  return prisma.$transaction([
    prisma.user.findMany({
      where,
      include: userListInclude,
      orderBy,
      skip: params.skip,
      take: params.take,
    }),
    prisma.user.count({ where }),
  ]);
}

export function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data, include: userListInclude });
}

export function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data, include: userListInclude });
}

export function softDeleteUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'INACTIVE' },
  });
}

export function replaceUserCompanies(userId: string, companyIds: string[]) {
  return prisma.$transaction([
    prisma.userCompany.deleteMany({ where: { userId } }),
    ...companyIds.map((companyId) =>
      prisma.userCompany.create({ data: { userId, companyId } }),
    ),
  ]);
}

export function replaceUserBranches(userId: string, branchIds: string[]) {
  return prisma.$transaction([
    prisma.userBranch.deleteMany({ where: { userId } }),
    ...branchIds.map((branchId) => prisma.userBranch.create({ data: { userId, branchId } })),
  ]);
}

export function replaceUserRoles(
  userId: string,
  assignments: { roleId: string; companyId: string | null; branchId: string | null }[],
) {
  return prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId } }),
    ...assignments.map((a) =>
      prisma.userRole.create({
        data: { userId, roleId: a.roleId, companyId: a.companyId, branchId: a.branchId },
      }),
    ),
  ]);
}
