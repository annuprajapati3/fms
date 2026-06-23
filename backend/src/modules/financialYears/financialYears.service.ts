import { prisma } from '@/config/prisma';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/AppError';
import { CreateFinancialYearInput, UpdateFinancialYearInput } from './financialYears.validators';

export async function listFinancialYears(companyId: string) {
  return prisma.financialYear.findMany({
    where: { companyId },
    orderBy: { startDate: 'desc' },
  });
}

export async function getFinancialYearById(id: string) {
  const fy = await prisma.financialYear.findUnique({ where: { id } });
  if (!fy) throw new NotFoundError('Financial year not found');
  return fy;
}

export async function createFinancialYear(input: CreateFinancialYearInput) {
  const company = await prisma.company.findFirst({ where: { id: input.companyId, deletedAt: null } });
  if (!company) throw new NotFoundError('Company not found');

  const existing = await prisma.financialYear.findUnique({
    where: { companyId_code: { companyId: input.companyId, code: input.code } },
  });
  if (existing) throw new ConflictError('A financial year with this code already exists for this company');

  const overlapping = await prisma.financialYear.findFirst({
    where: {
      companyId: input.companyId,
      OR: [{ startDate: { lte: input.endDate }, endDate: { gte: input.startDate } }],
    },
  });
  if (overlapping) throw new ConflictError('Financial year dates overlap with an existing financial year');

  return prisma.$transaction(async (tx) => {
    const fy = await tx.financialYear.create({
      data: {
        companyId: input.companyId,
        code: input.code,
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.isCurrent ? 'ACTIVE' : 'UPCOMING',
        isCurrent: input.isCurrent,
      },
    });

    if (input.isCurrent) {
      await tx.financialYear.updateMany({
        where: { companyId: input.companyId, id: { not: fy.id } },
        data: { isCurrent: false },
      });
    }

    return fy;
  });
}

export async function updateFinancialYear(id: string, input: UpdateFinancialYearInput) {
  const fy = await getFinancialYearById(id);
  if (fy.status === 'LOCKED') {
    throw new ForbiddenError('Cannot modify a locked financial year');
  }
  return prisma.financialYear.update({ where: { id }, data: input });
}

export async function setCurrentFinancialYear(id: string) {
  const fy = await getFinancialYearById(id);

  return prisma.$transaction(async (tx) => {
    await tx.financialYear.updateMany({
      where: { companyId: fy.companyId, id: { not: id } },
      data: { isCurrent: false },
    });
    return tx.financialYear.update({
      where: { id },
      data: { isCurrent: true, status: 'ACTIVE' },
    });
  });
}

export async function lockFinancialYear(id: string, lockedById: string) {
  const fy = await getFinancialYearById(id);
  if (fy.status === 'LOCKED') {
    throw new BadRequestError('Financial year is already locked');
  }
  return prisma.financialYear.update({
    where: { id },
    data: { status: 'LOCKED', lockedAt: new Date(), lockedById },
  });
}

export async function closeFinancialYear(id: string) {
  const fy = await getFinancialYearById(id);
  if (fy.status === 'LOCKED') {
    throw new ForbiddenError('Cannot close a locked financial year directly');
  }
  if (fy.isCurrent) {
    throw new BadRequestError('Cannot close the currently active financial year. Set another year as current first.');
  }
  return prisma.financialYear.update({ where: { id }, data: { status: 'CLOSED' } });
}
