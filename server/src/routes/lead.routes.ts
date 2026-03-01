import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { leadSchema, updateLeadStatusSchema } from '@dfd/shared';

const router = Router();

/**
 * PUBLIC ROUTES
 */
router.post('/', validateRequest(leadSchema), LeadController.create);

/**
 * ADMIN ROUTES (Protected)
 */
router.get('/', authenticateJWT, requireSuperadmin, LeadController.getAll);
router.get('/:id', authenticateJWT, requireSuperadmin, LeadController.getById);
router.patch('/:id/status', authenticateJWT, requireSuperadmin, validateRequest(updateLeadStatusSchema), LeadController.updateStatus);
router.delete('/:id', authenticateJWT, requireSuperadmin, LeadController.delete);

export default router;
