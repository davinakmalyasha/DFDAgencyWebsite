import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { orderSchema } from '@dfd/shared';

const router = Router();

/**
 * PUBLIC ROUTES
 */
router.post('/', validateRequest(orderSchema), OrderController.create);
router.get('/track/:orderId', OrderController.track);

/**
 * ADMIN ROUTES (Protected)
 */
router.get('/', authenticateJWT, requireSuperadmin, OrderController.getAll);
router.get('/:id', authenticateJWT, requireSuperadmin, OrderController.getById);
router.patch('/:id/status', authenticateJWT, requireSuperadmin, OrderController.updateStatus);
router.delete('/:id', authenticateJWT, requireSuperadmin, OrderController.delete);

export default router;
