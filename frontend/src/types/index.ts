export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';

export interface CompanyRef {
  id: string;
  code: string;
  name: string;
}

export interface BranchRef {
  id: string;
  code: string;
  name: string;
  companyId: string;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  status: UserStatus;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  companies: CompanyRef[];
  branches: BranchRef[];
  roles: string[];
}

export interface AuthContext {
  companyId: string | null;
  branchId: string | null;
  financialYearId: string | null;
  permissions: string[];
  roles: string[];
}

export interface Company {
  id: string;
  code: string;
  name: string;
  legalName: string | null;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { divisions: number; branches: number };
}

export interface Division {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  company?: CompanyRef;
  _count?: { branches: number };
}

export interface Branch {
  id: string;
  companyId: string;
  divisionId: string | null;
  code: string;
  name: string;
  type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  isHeadOffice: boolean;
  isActive: boolean;
  company?: CompanyRef;
  division?: { id: string; name: string; code: string } | null;
}

export type FinancialYearStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'LOCKED';

export interface FinancialYear {
  id: string;
  companyId: string;
  code: string;
  startDate: string;
  endDate: string;
  status: FinancialYearStatus;
  isCurrent: boolean;
  lockedAt: string | null;
}

export interface Role {
  id: string;
  companyId: string | null;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  rolePermissions: { permission: { id: string; code: string; action: string; module: { code: string; name: string } } }[];
}

export interface PermissionMatrixEntry {
  id: string;
  action: string;
  granted: boolean;
}

export interface PermissionMatrixModule {
  id: string;
  code: string;
  name: string;
  permissions: PermissionMatrixEntry[];
  children: {
    id: string;
    code: string;
    name: string;
    permissions: PermissionMatrixEntry[];
  }[];
}

export interface User {
  id: string;
  employeeCode: string | null;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  status: UserStatus;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  createdAt: string;
  userCompanies: { company: CompanyRef }[];
  userBranches: { branch: BranchRef }[];
  userRoles: { role: { id: string; code: string; name: string } }[];
}

export interface DashboardSummary {
  organization: { totalCompanies: number; totalDivisions: number; totalBranches: number };
  users: { totalUsers: number; activeUsers: number; inactiveUsers: number; lockedUsers: number };
  security: { totalRoles: number; recentFailedLogins: number };
  financialYear: { code: string; startDate: string; endDate: string; status: string } | null;
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    description: string | null;
    actorName: string | null;
    createdAt: string;
  }[];
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
