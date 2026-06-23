import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '@/middlewares/authenticate';
import { requirePermission, requireRole } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { paginationQuerySchema } from '@/shared/utils/pagination';
import * as companiesController from './companies.controller';
import { companyIdParamSchema, createCompanySchema, updateCompanySchema } from './companies.validators';

const router = Router();
const listQuerySchema = paginationQuerySchema.extend({ isActive: z.coerce.boolean().optional() });

router.use(authenticate);

router.get(
  '/',
  requirePermission('COMPANY.VIEW'),
  validate({ query: listQuerySchema }),
  companiesController.listCompanies,
);
router.get(
  '/:id',
  requirePermission('COMPANY.VIEW'),
  validate({ params: companyIdParamSchema }),
  companiesController.getCompany,
);
// Company creation is restricted to Super Admin - it is the top of the org hierarchy.
router.post(
  '/',
  requireRole('SUPER_ADMIN'),
  validate({ body: createCompanySchema }),
  companiesController.createCompany,
);
router.patch(
  '/:id',
  requirePermission('COMPANY.EDIT'),
  validate({ params: companyIdParamSchema, body: updateCompanySchema }),
  companiesController.updateCompany,
);
router.delete(
  '/:id',
  requireRole('SUPER_ADMIN'),
  validate({ params: companyIdParamSchema }),
  companiesController.deleteCompany,
);

export default router;
