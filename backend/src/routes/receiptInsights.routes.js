import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { handleGetReceiptInsights } from '../controllers/receiptInsights.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', handleGetReceiptInsights);

export default router;
