import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

/**
 * PUBLIC WEBHOOK ROUTE
 * This route is called by Midtrans servers.
 * It must be public but uses SHA512 signature verification.
 */
router.post('/webhook', PaymentController.handleWebhook);
router.get('/:orderId', authenticateJWT, requireSuperadmin, PaymentController.getByOrderId);

export default router;
