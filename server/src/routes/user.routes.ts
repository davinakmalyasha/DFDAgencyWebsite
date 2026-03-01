import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT, requireSuperadmin);

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', UserController.create);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.delete);

export default router;
