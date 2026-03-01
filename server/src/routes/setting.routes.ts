import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { globalSettingSchema } from '@dfd/shared';

const router = Router();

// Anyone can view settings (e.g. for frontend to get WA number)
router.get('/', SettingController.getSettings);

// Only Superadmin can update settings
router.put('/', authenticateJWT, requireSuperadmin, validateRequest(globalSettingSchema), SettingController.updateSettings);

export default router;
