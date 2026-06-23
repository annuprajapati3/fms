import { prisma } from '@/config/prisma';
import { NotFoundError } from '@/shared/errors/AppError';

export interface DashboardSummary {
  organization: {
    totalCompanies: number;
    totalDivisions: number;
    totalBranches: number;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    lockedUsers: number;
  };
  security: {
    totalRoles: number;
    recentFailedLogins: number;
  };
  financialYear: {
    code: string;
    startDate: Date;
    endDate: Date;
    status: string;
  } | null;
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    description: string | null;
    actorName: string | null;
    createdAt: Date;
  }[];
  // Placeholders for forthcoming phases - kept here so the frontend dashboard
  // layout/widgets can be built now against a stable shape.
  fleet: { totalVehicles: number; running: number; parked: number; breakdown: number } | null;
  drivers: { active: number; free: number; allocated: number } | null;
  trips: { running: number; completed: number; pending: number } | null;
  financial: { revenue: number; expenses: number; profit: number } | null;
  pendingActions: {
    pendingPOD: number;
    pendingInvoice: number;
    pendingExpenseSettlement: number;
    pendingVehicleDocuments: number;
    pendingDriverDocuments: number;
  } | null;
}

export async function getDashboardSummary(
  companyId: string | null,
  isSuperAdmin: boolean,
): Promise<DashboardSummary> {
  const companyScope = companyId ? { companyId } : {};
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalCompanies,
    totalDivisions,
    totalBranches,
    totalUsers,
    activeUsers,
    inactiveUsers,
    lockedUsers,
    totalRoles,
    recentFailedLogins,
    currentFY,
    recentAuditLogs,
  ] = await Promise.all([
    // Super Admin always sees the true platform-wide company count, regardless
    // of which company they currently have selected in the context switcher -
    // otherwise this number is meaningless (it would always read 1).
    isSuperAdmin
      ? prisma.company.count({ where: { deletedAt: null } })
      : prisma.company.count({ where: { deletedAt: null, ...(companyId ? { id: companyId } : {}) } }),
    prisma.division.count({ where: { deletedAt: null, ...companyScope } }),
    prisma.branch.count({ where: { deletedAt: null, ...companyScope } }),
    companyId
      ? prisma.user.count({ where: { deletedAt: null, userCompanies: { some: { companyId } } } })
      : prisma.user.count({ where: { deletedAt: null } }),
    companyId
      ? prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE', userCompanies: { some: { companyId } } } })
      : prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    companyId
      ? prisma.user.count({ where: { deletedAt: null, status: 'INACTIVE', userCompanies: { some: { companyId } } } })
      : prisma.user.count({ where: { deletedAt: null, status: 'INACTIVE' } }),
    companyId
      ? prisma.user.count({ where: { deletedAt: null, status: 'LOCKED', userCompanies: { some: { companyId } } } })
      : prisma.user.count({ where: { deletedAt: null, status: 'LOCKED' } }),
    prisma.role.count({ where: { deletedAt: null, ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {}) } }),
    prisma.auditLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: since24h }, ...companyScope } }),
    companyId ? prisma.financialYear.findFirst({ where: { companyId, isCurrent: true } }) : null,
    prisma.auditLog.findMany({
      where: companyScope,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { actor: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  return {
    organization: { totalCompanies, totalDivisions, totalBranches },
    users: { totalUsers, activeUsers, inactiveUsers, lockedUsers },
    security: { totalRoles, recentFailedLogins },
    financialYear: currentFY
      ? { code: currentFY.code, startDate: currentFY.startDate, endDate: currentFY.endDate, status: currentFY.status }
      : null,
    recentActivity: recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      description: log.description,
      actorName: log.actor ? `${log.actor.firstName} ${log.actor.lastName ?? ''}`.trim() : null,
      createdAt: log.createdAt,
    })),
    fleet: null,
    drivers: null,
    trips: null,
    financial: null,
    pendingActions: null,
  };
}

export async function getAuditTrail(params: {
  companyId?: string;
  entityType?: string;
  actorId?: string;
  skip: number;
  take: number;
}) {
  const where = {
    ...(params.companyId ? { companyId: params.companyId } : {}),
    ...(params.entityType ? { entityType: params.entityType } : {}),
    ...(params.actorId ? { actorId: params.actorId } : {}),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
      include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export async function ensureCompanyExists(companyId: string): Promise<void> {
  const company = await prisma.company.findFirst({ where: { id: companyId, deletedAt: null } });
  if (!company) throw new NotFoundError('Company not found');
}
