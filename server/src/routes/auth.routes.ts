import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { loginSchema, changePasswordSchema } from '@dfd/shared';
import { authRateLimiter, inviteVerifyRateLimiter } from '../middlewares/security.middleware';

const router = Router();

router.post('/login', authRateLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/invite/verify', inviteVerifyRateLimiter, AuthController.verifyInvite);
router.get('/invite/verify', inviteVerifyRateLimiter, AuthController.verifyInvite);
router.post('/logout', authenticateJWT, AuthController.logout);
router.get('/me', authenticateJWT, AuthController.me);
router.post('/change-password', authenticateJWT, validateRequest(changePasswordSchema), AuthController.changePassword);

export default router;
