import { ConflictError, NotFoundError } from '@/shared/errors/AppError';
import { hashPassword } from '@/shared/utils/password';
import { PaginationQuery, toSkipTake } from '@/shared/utils/pagination';
import * as usersRepo from './users.repository';
import { AssignBranchesInput, AssignCompaniesInput, AssignRolesInput, CreateUserInput, UpdateUserInput } from './users.validators';

export async function listUsers(query: PaginationQuery & { companyId?: string; status?: string }) {
  const { skip, take } = toSkipTake(query);
  const [users, total] = await usersRepo.findManyPaginated({
    skip,
    take,
    search: query.search,
    companyId: query.companyId,
    status: query.status,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
  return { users, total };
}

export async function getUserById(id: string) {
  const user = await usersRepo.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function createUser(input: CreateUserInput) {
  const existing = await usersRepo.findByEmail(input.email);
  if (existing) throw new ConflictError('A user with this email already exists');

  const passwordHash = await hashPassword(input.password);

  const user = await usersRepo.createUser({
    employeeCode: input.employeeCode,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    passwordHash,
    mustChangePassword: input.mustChangePassword,
    defaultCompanyId: input.defaultCompanyId ?? null,
    defaultBranchId: input.defaultBranchId ?? null,
    userCompanies: { create: input.companyIds.map((companyId) => ({ companyId })) },
    userBranches: { create: input.branchIds.map((branchId) => ({ branchId })) },
    userRoles: {
      create: input.roleAssignments.map((ra) => ({
        roleId: ra.roleId,
        companyId: ra.companyId,
        branchId: ra.branchId,
      })),
    },
  });

  return user;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  await getUserById(id); // ensures existence
  return usersRepo.updateUser(id, input);
}

export async function deleteUser(id: string) {
  await getUserById(id);
  await usersRepo.softDeleteUser(id);
}

export async function assignCompanies(id: string, input: AssignCompaniesInput) {
  await getUserById(id);
  await usersRepo.replaceUserCompanies(id, input.companyIds);
  return getUserById(id);
}

export async function assignBranches(id: string, input: AssignBranchesInput) {
  await getUserById(id);
  await usersRepo.replaceUserBranches(id, input.branchIds);
  return getUserById(id);
}

export async function assignRoles(id: string, input: AssignRolesInput) {
  await getUserById(id);
  await usersRepo.replaceUserRoles(id, input.roleAssignments);
  return getUserById(id);
}
