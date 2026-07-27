import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { handleGetDashboard } from '../controllers/dashboard.controller.js';
import dashboardAiRoutes from './dashboardAi.routes.js';

const router = Router();

router.use(requireAuth);

router.get('/', handleGetDashboard);
router.use('/insights', dashboardAiRoutes);

export default router;
