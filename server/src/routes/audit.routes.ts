import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

// System logs are strictly for Superadmins only
router.use(authenticateJWT);
router.use(requireSuperadmin);

// Define routes
router.get('/', AuditController.getLogs);

export default router;
