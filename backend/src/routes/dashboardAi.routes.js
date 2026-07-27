import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { handleGetDashboardAiSummary } from '../controllers/dashboardAi.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', handleGetDashboardAiSummary);

export default router;
