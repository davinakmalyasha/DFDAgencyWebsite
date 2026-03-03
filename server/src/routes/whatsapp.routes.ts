import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

// Highly sensitive routes, restricted to Superadmin
router.use(authenticateJWT);
router.use(requireSuperadmin);

router.get('/status', WhatsAppController.getStatus);
router.get('/qr', WhatsAppController.getQR);
router.post('/start', WhatsAppController.startSession);
router.post('/logout', WhatsAppController.logout);

export default router;
