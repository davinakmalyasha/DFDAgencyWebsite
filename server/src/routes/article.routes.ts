import { Router } from 'express';
import { ArticleController } from '../controllers/article.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { articleSchema } from '@dfd/shared';

const router = Router();

/**
 * PUBLIC ROUTES
 */
router.get('/', ArticleController.getPublished);
router.get('/:slug', ArticleController.getBySlug);

/**
 * ADMIN ROUTES (Protected)
 */
router.get('/all/admin', authenticateJWT, requireSuperadmin, ArticleController.getAll);
router.post('/', authenticateJWT, requireSuperadmin, validateRequest(articleSchema), ArticleController.create);
router.put('/:id', authenticateJWT, requireSuperadmin, validateRequest(articleSchema), ArticleController.update);
router.delete('/:id', authenticateJWT, requireSuperadmin, ArticleController.delete);

export default router;
