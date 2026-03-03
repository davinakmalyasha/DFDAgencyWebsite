import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Dashboard analytics is for authenticated users
router.use(authenticateJWT);

// Define routes
router.get('/', DashboardController.getAnalytics);

export default router;
