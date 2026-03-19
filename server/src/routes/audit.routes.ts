import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

// "Fortress" Security: Only Superadmins can view the audit trail
router.get('/', authenticateJWT, requireSuperadmin, AuditController.getAll);

export default router;
