import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

// Only Admins can invoke AI generation to prevent cost-spam
router.post('/generate-copy', authenticateJWT, requireSuperadmin, AIController.generateCopy);

export default router;
