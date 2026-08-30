import { Router } from 'express';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createClientRequestSchema, updateClientRequestSchema, milestoneDecisionSchema } from '@dfd/shared';
import { ClientController } from '../controllers/client.controller';
import { MilestoneController } from '../controllers/milestone.controller';

const router = Router();

function requireClientOrAdmin(req: any, res: any, next: any) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (req.user.role === 'CLIENT' || req.user.role === 'SUPERADMIN' || req.user.role === 'EDITOR') return next();
    return res.status(403).json({ success: false, message: 'Forbidden' });
}

router.get('/orders', authenticateJWT, requireClientOrAdmin, ClientController.getMyOrders);
router.get('/orders/:id/invoice', authenticateJWT, requireClientOrAdmin, ClientController.downloadInvoice);
router.get('/orders/:id/contract', authenticateJWT, requireClientOrAdmin, ClientController.downloadContract);
router.get('/orders/:id/welcome', authenticateJWT, requireClientOrAdmin, ClientController.downloadWelcome);
router.get('/orders/:id/milestones', authenticateJWT, requireClientOrAdmin, ClientController.listMilestones);
router.post('/orders/:id/milestones/:milestoneId/view', authenticateJWT, requireClientOrAdmin, MilestoneController.markViewed);
router.post('/orders/:id/milestones/:milestoneId/decide', authenticateJWT, requireClientOrAdmin, validateRequest({ body: milestoneDecisionSchema }), MilestoneController.decide);
router.get('/requests', authenticateJWT, requireClientOrAdmin, ClientController.getMyRequests);
router.post('/requests', authenticateJWT, requireClientOrAdmin, validateRequest(createClientRequestSchema), ClientController.createRequest);
router.post('/feedback', authenticateJWT, requireClientOrAdmin, ClientController.submitFeedback);

router.get('/admin/requests', authenticateJWT, requireSuperadmin, ClientController.listRequestsAdmin);
router.patch('/admin/requests/:id', authenticateJWT, requireSuperadmin, validateRequest(updateClientRequestSchema), ClientController.decideRequest);

export default router;
