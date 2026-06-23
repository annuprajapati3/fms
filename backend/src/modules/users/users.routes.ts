import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '@/middlewares/authenticate';
import { requirePermission } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { paginationQuerySchema } from '@/shared/utils/pagination';
import * as usersController from './users.controller';
import {
  assignBranchesSchema,
  assignCompaniesSchema,
  assignRolesSchema,
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from './users.validators';

const router = Router();

const listQuerySchema = paginationQuerySchema.extend({
  companyId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']).optional(),
});

router.use(authenticate);

router.get('/', requirePermission('USERS.VIEW'), validate({ query: listQuerySchema }), usersController.listUsers);
router.get('/:id', requirePermission('USERS.VIEW'), validate({ params: userIdParamSchema }), usersController.getUser);
router.post('/', requirePermission('USERS.CREATE'), validate({ body: createUserSchema }), usersController.createUser);
router.patch(
  '/:id',
  requirePermission('USERS.EDIT'),
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  usersController.updateUser,
);
router.delete(
  '/:id',
  requirePermission('USERS.DELETE'),
  validate({ params: userIdParamSchema }),
  usersController.deleteUser,
);

router.put(
  '/:id/companies',
  requirePermission('USERS.EDIT'),
  validate({ params: userIdParamSchema, body: assignCompaniesSchema }),
  usersController.assignCompanies,
);
router.put(
  '/:id/branches',
  requirePermission('USERS.EDIT'),
  validate({ params: userIdParamSchema, body: assignBranchesSchema }),
  usersController.assignBranches,
);
router.put(
  '/:id/roles',
  requirePermission('USERS.EDIT'),
  validate({ params: userIdParamSchema, body: assignRolesSchema }),
  usersController.assignRoles,
);

export default router;
