import { PrismaClient, PermissionAction } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Module registry mirrors the FMS spec. Submodules use dot notation, e.g. "FLEET.VEHICLE".
// Phase 1 wires up modules actually implemented; later phases will extend this list
// without needing migrations (Module/Permission are data, not schema).
const MODULE_DEFINITIONS: { code: string; name: string; sortOrder: number; children?: { code: string; name: string }[] }[] = [
  { code: 'DASHBOARD', name: 'Dashboard', sortOrder: 0 },
  {
    code: 'USERS',
    name: 'User Management',
    sortOrder: 1,
  },
  {
    code: 'ROLES',
    name: 'Role Management',
    sortOrder: 2,
  },
  { code: 'COMPANY', name: 'Company Management', sortOrder: 3 },
  { code: 'DIVISION', name: 'Division Management', sortOrder: 4 },
  { code: 'BRANCH', name: 'Branch Management', sortOrder: 5 },
  { code: 'FINANCIAL_YEAR', name: 'Financial Year Management', sortOrder: 6 },
  { code: 'AUDIT', name: 'Audit Logs', sortOrder: 7 },
  // Forward-declared for later phases so the permission matrix UI has stable categories.
  {
    code: 'OPERATIONS',
    name: 'Operations',
    sortOrder: 10,
    children: [
      { code: 'OPERATIONS.LOAD_PLANNING', name: 'Load Planning' },
      { code: 'OPERATIONS.TRIP', name: 'Trip Management' },
      { code: 'OPERATIONS.CHALLAN', name: 'Challan Management' },
      { code: 'OPERATIONS.POD', name: 'POD Management' },
      { code: 'OPERATIONS.RATE_MASTER', name: 'Rate Master' },
    ],
  },
  {
    code: 'FLEET',
    name: 'Fleet',
    sortOrder: 11,
    children: [
      { code: 'FLEET.VEHICLE', name: 'Vehicle Management' },
      { code: 'FLEET.TYRE', name: 'Tyre Management' },
      { code: 'FLEET.SERVICE', name: 'Service Management' },
    ],
  },
  {
    code: 'INVENTORY',
    name: 'Inventory',
    sortOrder: 12,
    children: [
      { code: 'INVENTORY.ITEM', name: 'Item Master' },
      { code: 'INVENTORY.STOCK', name: 'Stock Management' },
    ],
  },
  {
    code: 'FINANCE',
    name: 'Finance',
    sortOrder: 13,
    children: [
      { code: 'FINANCE.INVOICE', name: 'Invoice Management' },
      { code: 'FINANCE.ACCOUNTS', name: 'Accounts Management' },
    ],
  },
  {
    code: 'HRM',
    name: 'HRM',
    sortOrder: 14,
    children: [
      { code: 'HRM.EMPLOYEE', name: 'Employee Management' },
      { code: 'HRM.PAYROLL', name: 'Payroll Management' },
      { code: 'HRM.DRIVER', name: 'Driver Management' },
    ],
  },
];

const STANDARD_ACTIONS: PermissionAction[] = ['CREATE', 'EDIT', 'DELETE', 'VIEW', 'APPROVE', 'REJECT', 'EXPORT', 'PRINT'];
// Org/admin modules don't need the full action set (no Approve/Reject/Print on a Company record, for example).
const ADMIN_ACTIONS: PermissionAction[] = ['CREATE', 'EDIT', 'DELETE', 'VIEW', 'EXPORT'];
const VIEW_ONLY_ACTIONS: PermissionAction[] = ['VIEW', 'EXPORT'];

const ADMIN_MODULE_CODES = new Set([
  'USERS',
  'ROLES',
  'COMPANY',
  'DIVISION',
  'BRANCH',
  'FINANCIAL_YEAR',
]);
const VIEW_ONLY_MODULE_CODES = new Set(['DASHBOARD', 'AUDIT']);

function actionsForModule(code: string): PermissionAction[] {
  if (VIEW_ONLY_MODULE_CODES.has(code)) return VIEW_ONLY_ACTIONS;
  if (ADMIN_MODULE_CODES.has(code)) return ADMIN_ACTIONS;
  return STANDARD_ACTIONS;
}

async function seedModulesAndPermissions(): Promise<void> {
  for (const moduleDef of MODULE_DEFINITIONS) {
    const parent = await prisma.module.upsert({
      where: { code: moduleDef.code },
      update: { name: moduleDef.name, sortOrder: moduleDef.sortOrder },
      create: { code: moduleDef.code, name: moduleDef.name, sortOrder: moduleDef.sortOrder },
    });

    for (const action of actionsForModule(moduleDef.code)) {
      await prisma.permission.upsert({
        where: { code: `${moduleDef.code}.${action}` },
        update: {},
        create: { moduleId: parent.id, action, code: `${moduleDef.code}.${action}` },
      });
    }

    if (moduleDef.children) {
      for (const [index, child] of moduleDef.children.entries()) {
        const childModule = await prisma.module.upsert({
          where: { code: child.code },
          update: { name: child.name, parentId: parent.id, sortOrder: index },
          create: { code: child.code, name: child.name, parentId: parent.id, sortOrder: index },
        });

        for (const action of STANDARD_ACTIONS) {
          await prisma.permission.upsert({
            where: { code: `${child.code}.${action}` },
            update: {},
            create: { moduleId: childModule.id, action, code: `${child.code}.${action}` },
          });
        }
      }
    }
  }

  console.log('✓ Modules and permissions seeded');
}

async function seedSystemRoles(): Promise<void> {
  // Super Admin: global role (companyId null), all permissions implicitly bypassed
  // by the requirePermission middleware - but we still attach every permission so
  // the permission-matrix UI displays it as fully checked for transparency.
  const allPermissions = await prisma.permission.findMany();

  const existingSuperAdmin = await prisma.role.findFirst({ where: { companyId: null, code: 'SUPER_ADMIN' } });

  const superAdminRole = existingSuperAdmin
    ? existingSuperAdmin
    : await prisma.role.create({
        data: {
          companyId: null,
          code: 'SUPER_ADMIN',
          name: 'Super Admin',
          description: 'Full unrestricted access across all companies and modules',
          isSystem: true,
        },
      });

  await prisma.rolePermission.deleteMany({ where: { roleId: superAdminRole.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: superAdminRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  console.log('✓ Super Admin system role seeded');
  return;
}

async function seedSampleOrganization(): Promise<{ companyId: string; branchId: string }> {
  const company = await prisma.company.upsert({
    where: { code: 'COMPA' },
    update: {},
    create: {
      code: 'COMPA',
      name: 'Company A Logistics Pvt Ltd',
      legalName: 'Company A Logistics Private Limited',
      city: 'Gurugram',
      state: 'Haryana',
      country: 'India',
    },
  });

  const transportDivision = await prisma.division.upsert({
    where: { companyId_code: { companyId: company.id, code: 'TRANSPORT' } },
    update: {},
    create: { companyId: company.id, code: 'TRANSPORT', name: 'Transport Division' },
  });

  const hqBranch = await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: 'HQ' } },
    update: {},
    create: {
      companyId: company.id,
      divisionId: transportDivision.id,
      code: 'HQ',
      name: 'Head Office',
      type: 'HQ',
      city: 'Gurugram',
      state: 'Haryana',
      isHeadOffice: true,
    },
  });

  await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: 'DHARUHERA' } },
    update: {},
    create: {
      companyId: company.id,
      divisionId: transportDivision.id,
      code: 'DHARUHERA',
      name: 'Dharuhera Branch',
      city: 'Dharuhera',
      state: 'Haryana',
    },
  });

  await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: 'JAMALPUR' } },
    update: {},
    create: {
      companyId: company.id,
      divisionId: transportDivision.id,
      code: 'JAMALPUR',
      name: 'Jamalpur Branch',
      city: 'Jamalpur',
      state: 'Haryana',
    },
  });

  const now = new Date();
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // Indian FY: Apr-Mar
  await prisma.financialYear.upsert({
    where: { companyId_code: { companyId: company.id, code: `${fyStartYear}-${String(fyStartYear + 1).slice(-2)}` } },
    update: {},
    create: {
      companyId: company.id,
      code: `${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`,
      startDate: new Date(fyStartYear, 3, 1),
      endDate: new Date(fyStartYear + 1, 2, 31),
      status: 'ACTIVE',
      isCurrent: true,
    },
  });

  console.log('✓ Sample organization (Company A, Transport Division, HQ/Dharuhera/Jamalpur branches) seeded');
  return { companyId: company.id, branchId: hqBranch.id };
}

async function seedSuperAdminUser(companyId: string, branchId: string): Promise<void> {
  const email = 'superadmin@fms.local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('✓ Super Admin user already exists, skipping');
    return;
  }

  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  const superAdminRole = await prisma.role.findFirstOrThrow({ where: { code: 'SUPER_ADMIN', companyId: null } });

  await prisma.user.create({
    data: {
      employeeCode: 'EMP-0001',
      firstName: 'Super',
      lastName: 'Admin',
      email,
      passwordHash,
      mustChangePassword: true,
      status: 'ACTIVE',
      defaultCompanyId: companyId,
      defaultBranchId: branchId,
      userCompanies: { create: { companyId, isDefault: true } },
      userBranches: { create: { branchId, isDefault: true } },
      userRoles: { create: { roleId: superAdminRole.id, companyId: null, branchId: null } },
    },
  });

  console.log('✓ Super Admin user created');
  console.log('  Email:    superadmin@fms.local');
  console.log('  Password: ChangeMe123!  (mustChangePassword=true — change on first login)');
}

async function main(): Promise<void> {
  console.log('Seeding FMS database...\n');
  await seedModulesAndPermissions();
  await seedSystemRoles();
  const { companyId, branchId } = await seedSampleOrganization();
  await seedSuperAdminUser(companyId, branchId);
  console.log('\nSeed completed successfully.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
