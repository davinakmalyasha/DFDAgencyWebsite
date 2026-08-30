import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { orderSchema, orderIdParamsSchema, uuidParamsSchema, updateOrderStatusSchema, noteIdParamsSchema, resourceIdParamsSchema } from '@dfd/shared';
import { publicFormLimiter } from '../middlewares/security.middleware';
import { magicAuth } from '../middlewares/magic.middleware';

const router = Router();

/**
 * PUBLIC ROUTES
 */
router.post('/', publicFormLimiter, validateRequest(orderSchema), OrderController.create);

// Track basic status (middleware handles isLocked flag)
router.get('/track/:orderId', validateRequest({ params: orderIdParamsSchema }), magicAuth, OrderController.track);

// Verify to unlock full tracking
router.post('/track/:orderId/verify', publicFormLimiter, validateRequest({ params: orderIdParamsSchema }), OrderController.verifyMagicLink);

// Hardened tracking actions (Require magicAuth verification)
router.post('/track/:orderId/notes', validateRequest({ params: orderIdParamsSchema }), magicAuth, OrderController.submitClientNote);
router.patch('/track/:orderId/notes/:noteId', validateRequest({ params: orderIdParamsSchema }), magicAuth, OrderController.updateClientNote);
router.delete('/track/:orderId/notes/:noteId', validateRequest({ params: orderIdParamsSchema }), magicAuth, OrderController.deleteClientNote);
router.post('/track/:id/testimonial', validateRequest({ params: uuidParamsSchema }), magicAuth, OrderController.submitTestimonial);
router.get('/track/:id/invoice', validateRequest({ params: uuidParamsSchema }), magicAuth, OrderController.downloadInvoice);
router.get('/track/:id/contract', validateRequest({ params: uuidParamsSchema }), magicAuth, OrderController.downloadContract);
router.get('/track/:id/welcome', validateRequest({ params: uuidParamsSchema }), magicAuth, OrderController.downloadWelcome);

import { OrderNoteController } from '../controllers/ordernote.controller';
import { OrderResourceController } from '../controllers/orderresource.controller';
import { MilestoneController } from '../controllers/milestone.controller';
import { createMilestoneSchema, updateMilestoneSchema } from '@dfd/shared';

/**
 * ADMIN ROUTES (Protected)
 */
router.get('/', authenticateJWT, requireSuperadmin, OrderController.getAll);
router.get('/:id', authenticateJWT, requireSuperadmin, validateRequest({ params: uuidParamsSchema }), OrderController.getById);
router.get('/:id/invoice', authenticateJWT, requireSuperadmin, validateRequest({ params: uuidParamsSchema }), OrderController.downloadInvoice);
router.get('/:id/contract', authenticateJWT, requireSuperadmin, validateRequest({ params: uuidParamsSchema }), OrderController.downloadContract);
router.get('/:id/welcome', authenticateJWT, requireSuperadmin, validateRequest({ params: uuidParamsSchema }), OrderController.downloadWelcome);
router.patch('/:id/status', authenticateJWT, requireSuperadmin, validateRequest({ body: updateOrderStatusSchema, params: uuidParamsSchema }), OrderController.updateStatus);
router.post('/:id/promote', authenticateJWT, requireSuperadmin, validateRequest({ params: uuidParamsSchema }), OrderController.promoteToProject);
router.delete('/:id', authenticateJWT, requireSuperadmin, validateRequest({ params: uuidParamsSchema }), OrderController.delete);

// Order Notes (Project Diary) Routes
router.get('/:orderId/notes', authenticateJWT, requireSuperadmin, validateRequest({ params: orderIdParamsSchema }), OrderNoteController.getNotes);
router.post('/:orderId/notes', authenticateJWT, requireSuperadmin, validateRequest({ params: orderIdParamsSchema }), OrderNoteController.createNote);
router.patch('/notes/:noteId', authenticateJWT, requireSuperadmin, validateRequest({ params: noteIdParamsSchema }), OrderNoteController.updateNote);
router.delete('/notes/:noteId', authenticateJWT, requireSuperadmin, validateRequest({ params: noteIdParamsSchema }), OrderNoteController.deleteNote);

// Order Resource Links Routes
router.get('/:orderId/resources', authenticateJWT, requireSuperadmin, validateRequest({ params: orderIdParamsSchema }), OrderResourceController.getResources);
router.post('/:orderId/resources', authenticateJWT, requireSuperadmin, validateRequest({ params: orderIdParamsSchema }), OrderResourceController.createResource);
router.patch('/resources/:resourceId', authenticateJWT, requireSuperadmin, validateRequest({ params: resourceIdParamsSchema }), OrderResourceController.updateResource);
router.delete('/resources/:resourceId', authenticateJWT, requireSuperadmin, validateRequest({ params: resourceIdParamsSchema }), OrderResourceController.deleteResource);

// Order Milestones (Deliverables) Routes
router.get('/:orderId/milestones', authenticateJWT, requireSuperadmin, validateRequest({ params: orderIdParamsSchema }), MilestoneController.list);
router.post('/:orderId/milestones', authenticateJWT, requireSuperadmin, validateRequest({ params: orderIdParamsSchema, body: createMilestoneSchema }), MilestoneController.create);
router.patch('/milestones/:milestoneId', authenticateJWT, requireSuperadmin, validateRequest({ body: updateMilestoneSchema }), MilestoneController.update);
router.delete('/milestones/:milestoneId', authenticateJWT, requireSuperadmin, MilestoneController.remove);
router.get('/:orderId/whatsapp-link', authenticateJWT, requireSuperadmin, validateRequest({ params: orderIdParamsSchema }), MilestoneController.whatsappLink);
router.get('/:orderId/activity', authenticateJWT, requireSuperadmin, validateRequest({ params: orderIdParamsSchema }), MilestoneController.activity);

export default router;
