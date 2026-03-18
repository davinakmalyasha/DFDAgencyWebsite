import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { projectSchema } from '@dfd/shared';

const router = Router();

/**
 * PUBLIC ROUTES
 */
router.get('/', ProjectController.getAll);
router.get('/:slug', ProjectController.getBySlug);

/**
 * ADMIN ROUTES (Protected)
 */
router.post('/', authenticateJWT, requireSuperadmin, validateRequest(projectSchema), ProjectController.create);
router.put('/:id', authenticateJWT, requireSuperadmin, validateRequest(projectSchema.partial()), ProjectController.update);
router.delete('/:id', authenticateJWT, requireSuperadmin, ProjectController.delete);

// Image Management
router.post('/:projectId/images', authenticateJWT, requireSuperadmin, ProjectController.addImage);
router.delete('/:projectId/images/:imageId', authenticateJWT, requireSuperadmin, ProjectController.deleteImage);

export default router;
