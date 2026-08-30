import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { userCreateSchema, userUpdateSchema } from '@dfd/shared';

const router = Router();

router.use(authenticateJWT, requireSuperadmin);

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', validateRequest(userCreateSchema), UserController.create);
router.post('/:id/resend-invite', UserController.resendInvite);
router.post('/:id/revoke', UserController.revokeSessions);
router.put('/:id', validateRequest(userUpdateSchema), UserController.update);
router.delete('/:id', UserController.delete);

export default router;
