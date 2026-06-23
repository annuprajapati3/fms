import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '@/middlewares/authenticate';
import { requirePermission } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { paginationQuerySchema } from '@/shared/utils/pagination';
import * as branchesController from './branches.controller';
import { branchIdParamSchema, createBranchSchema, updateBranchSchema } from './branches.validators';

const router = Router();
const listQuerySchema = paginationQuerySchema.extend({
  companyId: z.string().uuid().optional(),
  divisionId: z.string().uuid().optional(),
});

router.use(authenticate);

router.get(
  '/',
  requirePermission('BRANCH.VIEW'),
  validate({ query: listQuerySchema }),
  branchesController.listBranches,
);
router.get(
  '/:id',
  requirePermission('BRANCH.VIEW'),
  validate({ params: branchIdParamSchema }),
  branchesController.getBranch,
);
router.post(
  '/',
  requirePermission('BRANCH.CREATE'),
  validate({ body: createBranchSchema }),
  branchesController.createBranch,
);
router.patch(
  '/:id',
  requirePermission('BRANCH.EDIT'),
  validate({ params: branchIdParamSchema, body: updateBranchSchema }),
  branchesController.updateBranch,
);
router.delete(
  '/:id',
  requirePermission('BRANCH.DELETE'),
  validate({ params: branchIdParamSchema }),
  branchesController.deleteBranch,
);

export default router;
