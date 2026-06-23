import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '@/middlewares/authenticate';
import { requireAnyPermission, requirePermission } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { paginationQuerySchema } from '@/shared/utils/pagination';
import * as dashboardController from './dashboard.controller';

const router = Router();

const summaryQuerySchema = z.object({ companyId: z.string().uuid().optional() });
const auditQuerySchema = paginationQuerySchema.extend({
  companyId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  actorId: z.string().uuid().optional(),
});

router.use(authenticate);

router.get(
  '/summary',
  requirePermission('DASHBOARD.VIEW'),
  validate({ query: summaryQuerySchema }),
  dashboardController.getSummary,
);
router.get(
  '/audit-trail',
  requireAnyPermission('DASHBOARD.VIEW', 'AUDIT.VIEW'),
  validate({ query: auditQuerySchema }),
  dashboardController.getAuditTrail,
);

export default router;
