import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '@/middlewares/validate';
import { authenticate } from '@/middlewares/authenticate';
import * as authController from './auth.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  selectBranchSchema,
  selectCompanySchema,
  selectFinancialYearSchema,
} from './auth.validators';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts, try again later' } },
});

router.post('/login', loginLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.me);

router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);
router.post('/forgot-password', loginLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), authController.resetPassword);

router.post('/select-company', authenticate, validate({ body: selectCompanySchema }), authController.selectCompany);
router.post('/select-branch', authenticate, validate({ body: selectBranchSchema }), authController.selectBranch);
router.post(
  '/select-financial-year',
  authenticate,
  validate({ body: selectFinancialYearSchema }),
  authController.selectFinancialYear,
);

export default router;
