import { Router } from 'express';
import authRoutes from '@/modules/auth/auth.routes';
import usersRoutes from '@/modules/users/users.routes';
import rolesRoutes from '@/modules/roles/roles.routes';
import permissionsRoutes from '@/modules/permissions/permissions.routes';
import companiesRoutes from '@/modules/companies/companies.routes';
import divisionsRoutes from '@/modules/divisions/divisions.routes';
import branchesRoutes from '@/modules/branches/branches.routes';
import financialYearsRoutes from '@/modules/financialYears/financialYears.routes';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/companies', companiesRoutes);
router.use('/divisions', divisionsRoutes);
router.use('/branches', branchesRoutes);
router.use('/financial-years', financialYearsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
