import { Router } from 'express';
import { PromoController } from '../controllers/promo.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { promoSchema } from '@dfd/shared';

const router = Router();

/**
 * PUBLIC ROUTES
 */
router.get('/active', PromoController.getActive);

/**
 * ADMIN ROUTES
 */
router.get('/', authenticateJWT, requireSuperadmin, PromoController.getAll);
router.post('/', authenticateJWT, requireSuperadmin, validateRequest(promoSchema), PromoController.create);
router.put('/:id', authenticateJWT, requireSuperadmin, validateRequest(promoSchema), PromoController.update);
router.delete('/:id', authenticateJWT, requireSuperadmin, PromoController.delete);

export default router;
