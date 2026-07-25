import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { handleGetDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', handleGetDashboard);

export default router;
