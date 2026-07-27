import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { uploadReceiptFile } from '../middlewares/upload.middleware.js';
import {
  handleCreateReceipt,
  handleGetReceipts,
  handleGetReceiptById,
  handleUpdateReceipt,
  handleDeleteReceipt,
} from '../controllers/receipt.controller.js';
import { checkDuplicate } from '../controllers/duplicateReceipt.controller.js';
import receiptInsightsRoutes from './receiptInsights.routes.js';

const router = Router();

// Protect all receipt routes
router.use(requireAuth);

router.post('/check-duplicate', checkDuplicate);
router.use('/:id/insights', receiptInsightsRoutes);

router.post('/', uploadReceiptFile, handleCreateReceipt);
router.get('/', handleGetReceipts);
router.get('/:id', handleGetReceiptById);
router.put('/:id', uploadReceiptFile, handleUpdateReceipt);
router.delete('/:id', handleDeleteReceipt);

export default router;
