import { Request, Response } from 'express';
import { Router } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { authenticate } from '@/middlewares/authenticate';
import { requirePermission } from '@/middlewares/authorize';
import { sendSuccess } from '@/shared/utils/apiResponse';
import { prisma } from '@/config/prisma';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('ROLES.VIEW'),
  asyncHandler(async (_req: Request, res: Response) => {
    const permissions = await prisma.permission.findMany({
      include: { module: true },
      orderBy: [{ module: { sortOrder: 'asc' } }, { action: 'asc' }],
    });
    sendSuccess(res, permissions);
  }),
);

router.get(
  '/modules',
  authenticate,
  requirePermission('ROLES.VIEW'),
  asyncHandler(async (_req: Request, res: Response) => {
    const modules = await prisma.module.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        permissions: true,
        children: { orderBy: { sortOrder: 'asc' }, include: { permissions: true } },
      },
    });
    sendSuccess(res, modules);
  }),
);

export default router;
