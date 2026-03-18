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
router.post('/track/:orderId/notes', OrderController.submitClientNote);
router.patch('/track/:orderId/notes/:noteId', OrderController.updateClientNote);
router.delete('/track/:orderId/notes/:noteId', OrderController.deleteClientNote);
router.post('/track/:id/testimonial', OrderController.submitTestimonial);
router.get('/track/:id/invoice', OrderController.downloadInvoice);

import { OrderNoteController } from '../controllers/ordernote.controller';
import { OrderResourceController } from '../controllers/orderresource.controller';

/**
 * ADMIN ROUTES (Protected)
 */
router.get('/', authenticateJWT, requireSuperadmin, OrderController.getAll);
router.get('/:id', authenticateJWT, requireSuperadmin, OrderController.getById);
router.get('/:id/invoice', authenticateJWT, requireSuperadmin, OrderController.downloadInvoice);
router.get('/:id/pay', authenticateJWT, requireSuperadmin, OrderController.getPaymentUrl);
router.patch('/:id/status', authenticateJWT, requireSuperadmin, OrderController.updateStatus);
router.post('/:id/promote', authenticateJWT, requireSuperadmin, OrderController.promoteToProject);
router.delete('/:id', authenticateJWT, requireSuperadmin, OrderController.delete);

// Order Notes (Project Diary) Routes
router.get('/:orderId/notes', authenticateJWT, requireSuperadmin, OrderNoteController.getNotes);
router.post('/:orderId/notes', authenticateJWT, requireSuperadmin, OrderNoteController.createNote);
router.patch('/notes/:noteId', authenticateJWT, requireSuperadmin, OrderNoteController.updateNote);
router.delete('/notes/:noteId', authenticateJWT, requireSuperadmin, OrderNoteController.deleteNote);

// Order Resource Links Routes
router.get('/:orderId/resources', authenticateJWT, requireSuperadmin, OrderResourceController.getResources);
router.post('/:orderId/resources', authenticateJWT, requireSuperadmin, OrderResourceController.createResource);
router.patch('/resources/:resourceId', authenticateJWT, requireSuperadmin, OrderResourceController.updateResource);
router.delete('/resources/:resourceId', authenticateJWT, requireSuperadmin, OrderResourceController.deleteResource);

export default router;
