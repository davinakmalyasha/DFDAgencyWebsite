import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { loginSchema } from '@dfd/shared';

const router = Router();

router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/logout', authenticateJWT, AuthController.logout);
router.get('/me', authenticateJWT, AuthController.me);

export default router;
