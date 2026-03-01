import { Router } from 'express';
import { PackageController } from '../controllers/package.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { packageSchema } from '@dfd/shared';

const router = Router();

/**
 * PUBLIC ROUTES
 */
router.get('/', PackageController.getAll);
router.get('/:slug', PackageController.getBySlug);

/**
 * ADMIN ROUTES (Protected)
 */
router.post('/', authenticateJWT, requireSuperadmin, validateRequest(packageSchema), PackageController.create);
router.patch('/:id', authenticateJWT, requireSuperadmin, validateRequest(packageSchema.partial()), PackageController.update);
router.delete('/:id', authenticateJWT, requireSuperadmin, PackageController.delete);

export default router;
