import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '@/middlewares/authenticate';
import { requirePermission } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { paginationQuerySchema } from '@/shared/utils/pagination';
import * as rolesController from './roles.controller';
import { createRoleSchema, roleIdParamSchema, setRolePermissionsSchema, updateRoleSchema } from './roles.validators';

const router = Router();
const listQuerySchema = paginationQuerySchema.extend({ companyId: z.string().uuid().optional() });

router.use(authenticate);

router.get('/', requirePermission('ROLES.VIEW'), validate({ query: listQuerySchema }), rolesController.listRoles);
router.get('/:id', requirePermission('ROLES.VIEW'), validate({ params: roleIdParamSchema }), rolesController.getRole);
router.get(
  '/:id/permission-matrix',
  requirePermission('ROLES.VIEW'),
  validate({ params: roleIdParamSchema }),
  rolesController.getPermissionMatrix,
);
router.post('/', requirePermission('ROLES.CREATE'), validate({ body: createRoleSchema }), rolesController.createRole);
router.patch(
  '/:id',
  requirePermission('ROLES.EDIT'),
  validate({ params: roleIdParamSchema, body: updateRoleSchema }),
  rolesController.updateRole,
);
router.delete(
  '/:id',
  requirePermission('ROLES.DELETE'),
  validate({ params: roleIdParamSchema }),
  rolesController.deleteRole,
);
router.put(
  '/:id/permissions',
  requirePermission('ROLES.EDIT'),
  validate({ params: roleIdParamSchema, body: setRolePermissionsSchema }),
  rolesController.setRolePermissions,
);

export default router;
