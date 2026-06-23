import { prisma } from '@/config/prisma';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/AppError';
import { PaginationQuery, toSkipTake } from '@/shared/utils/pagination';
import { buildOrderBy } from '@/shared/utils/sorting';
import { CreateRoleInput, UpdateRoleInput } from './roles.validators';

const SORTABLE_COLUMNS = ['name', 'code', 'createdAt', 'updatedAt', 'isActive'] as const;

const roleInclude = {
  rolePermissions: { include: { permission: { include: { module: true } } } },
} as const;

export async function listRoles(query: PaginationQuery & { companyId?: string }) {
  const { skip, take } = toSkipTake(query);
  const where = {
    deletedAt: null,
    ...(query.companyId ? { OR: [{ companyId: query.companyId }, { companyId: null }] } : {}),
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
  };

  const [roles, total] = await prisma.$transaction([
    prisma.role.findMany({
      where,
      include: roleInclude,
      orderBy: buildOrderBy(query.sortBy, query.sortDir, SORTABLE_COLUMNS, 'createdAt'),
      skip,
      take,
    }),
    prisma.role.count({ where }),
  ]);

  return { roles, total };
}

export async function getRoleById(id: string) {
  const role = await prisma.role.findFirst({ where: { id, deletedAt: null }, include: roleInclude });
  if (!role) throw new NotFoundError('Role not found');
  return role;
}

export async function createRole(input: CreateRoleInput) {
  const existing = await prisma.role.findFirst({
    where: { code: input.code, companyId: input.companyId },
  });
  if (existing) throw new ConflictError('A role with this code already exists in this scope');

  return prisma.role.create({
    data: {
      companyId: input.companyId,
      code: input.code,
      name: input.name,
      description: input.description,
      rolePermissions: { create: input.permissionIds.map((permissionId) => ({ permissionId })) },
    },
    include: roleInclude,
  });
}

export async function updateRole(id: string, input: UpdateRoleInput) {
  const role = await getRoleById(id);
  if (role.isSystem) {
    throw new ForbiddenError('System roles cannot be modified');
  }
  return prisma.role.update({ where: { id }, data: input, include: roleInclude });
}

export async function deleteRole(id: string) {
  const role = await getRoleById(id);
  if (role.isSystem) throw new ForbiddenError('System roles cannot be deleted');

  const assignmentCount = await prisma.userRole.count({ where: { roleId: id } });
  if (assignmentCount > 0) {
    throw new BadRequestError('Cannot delete a role that is currently assigned to users');
  }

  await prisma.role.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
}

export async function setRolePermissions(id: string, permissionIds: string[]) {
  const role = await getRoleById(id);
  if (role.isSystem) throw new ForbiddenError('System role permissions cannot be modified');

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: id } }),
    ...permissionIds.map((permissionId) =>
      prisma.rolePermission.create({ data: { roleId: id, permissionId } }),
    ),
  ]);

  return getRoleById(id);
}

/**
 * Returns the full permission matrix grouped by module hierarchy, with each
 * permission flagged as granted/not for the given role. Used to render the
 * permission-matrix UI (module x submodule x action checkboxes).
 */
export async function getPermissionMatrixForRole(roleId: string) {
  const role = await getRoleById(roleId);
  const grantedIds = new Set(role.rolePermissions.map((rp) => rp.permissionId));

  const modules = await prisma.module.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      permissions: true,
      children: {
        orderBy: { sortOrder: 'asc' },
        include: { permissions: true },
      },
    },
  });

  return modules.map((module) => ({
    id: module.id,
    code: module.code,
    name: module.name,
    permissions: module.permissions.map((p) => ({ id: p.id, action: p.action, granted: grantedIds.has(p.id) })),
    children: module.children.map((child) => ({
      id: child.id,
      code: child.code,
      name: child.name,
      permissions: child.permissions.map((p) => ({ id: p.id, action: p.action, granted: grantedIds.has(p.id) })),
    })),
  }));
}
