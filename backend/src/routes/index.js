import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import receiptRoutes from './receipt.routes.js';
import aiRoutes from './ai.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import askReceiptlyRoutes from './askReceiptly.routes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    name: 'Receiptly API',
    version: '1.0.0',
    status: 'online',
    documentation: 'https://github.com/tanmoy7272/receiptly',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      receipts: '/api/v1/receipts',
      dashboard: '/api/v1/dashboard',
      ask: '/api/v1/ask',
    },
  });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/ai', aiRoutes);
router.use('/receipts', receiptRoutes);
router.use('/ask', askReceiptlyRoutes);

export default router;
