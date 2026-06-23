import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { requirePermission, requireRole } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import * as fyController from './financialYears.controller';
import {
  createFinancialYearSchema,
  financialYearIdParamSchema,
  updateFinancialYearSchema,
} from './financialYears.validators';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('FINANCIAL_YEAR.VIEW'), fyController.listFinancialYears);
router.get(
  '/:id',
  requirePermission('FINANCIAL_YEAR.VIEW'),
  validate({ params: financialYearIdParamSchema }),
  fyController.getFinancialYear,
);
router.post(
  '/',
  requirePermission('FINANCIAL_YEAR.CREATE'),
  validate({ body: createFinancialYearSchema }),
  fyController.createFinancialYear,
);
router.patch(
  '/:id',
  requirePermission('FINANCIAL_YEAR.EDIT'),
  validate({ params: financialYearIdParamSchema, body: updateFinancialYearSchema }),
  fyController.updateFinancialYear,
);
router.post(
  '/:id/set-current',
  requirePermission('FINANCIAL_YEAR.EDIT'),
  validate({ params: financialYearIdParamSchema }),
  fyController.setCurrentFinancialYear,
);
// Locking a financial year is a sensitive accounting operation - restricted to Company/Super Admin.
router.post(
  '/:id/lock',
  requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'),
  validate({ params: financialYearIdParamSchema }),
  fyController.lockFinancialYear,
);
router.post(
  '/:id/close',
  requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'),
  validate({ params: financialYearIdParamSchema }),
  fyController.closeFinancialYear,
);

export default router;
