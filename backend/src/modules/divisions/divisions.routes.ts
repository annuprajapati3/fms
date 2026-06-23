import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '@/middlewares/authenticate';
import { requirePermission } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { paginationQuerySchema } from '@/shared/utils/pagination';
import * as divisionsController from './divisions.controller';
import { createDivisionSchema, divisionIdParamSchema, updateDivisionSchema } from './divisions.validators';

const router = Router();
const listQuerySchema = paginationQuerySchema.extend({ companyId: z.string().uuid().optional() });

router.use(authenticate);

router.get(
  '/',
  requirePermission('DIVISION.VIEW'),
  validate({ query: listQuerySchema }),
  divisionsController.listDivisions,
);
router.get(
  '/:id',
  requirePermission('DIVISION.VIEW'),
  validate({ params: divisionIdParamSchema }),
  divisionsController.getDivision,
);
router.post(
  '/',
  requirePermission('DIVISION.CREATE'),
  validate({ body: createDivisionSchema }),
  divisionsController.createDivision,
);
router.patch(
  '/:id',
  requirePermission('DIVISION.EDIT'),
  validate({ params: divisionIdParamSchema, body: updateDivisionSchema }),
  divisionsController.updateDivision,
);
router.delete(
  '/:id',
  requirePermission('DIVISION.DELETE'),
  validate({ params: divisionIdParamSchema }),
  divisionsController.deleteDivision,
);

export default router;
