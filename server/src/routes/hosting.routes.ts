import { Router } from 'express';
import { HostingController } from '../controllers/hosting.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createHostingSchema, updateHostingSchema } from '@dfd/shared';

const router = Router();

// All hosting routes require authentication
router.use(authenticateJWT);

router.get('/', HostingController.getAll);
router.get('/stats', HostingController.getStats);
router.get('/:id', HostingController.getById);
router.post('/', validateRequest(createHostingSchema), HostingController.create);
router.put('/:id', validateRequest(updateHostingSchema), HostingController.update);
router.delete('/:id', HostingController.remove);

export default router;
