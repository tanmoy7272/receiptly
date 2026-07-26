import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { uploadReceiptFile } from '../middlewares/upload.middleware.js';
import {
  handleCreateReceipt,
  handleGetReceipts,
  handleGetReceiptById,
  handleUpdateReceipt,
  handleDeleteReceipt,
  handleGetReceiptFile,
} from '../controllers/receipt.controller.js';

const router = Router();

// Protect all receipt routes
router.use(requireAuth);

router.post('/', uploadReceiptFile, handleCreateReceipt);
router.get('/', handleGetReceipts);
router.get('/:id', handleGetReceiptById);
router.get('/:id/file', handleGetReceiptFile);
router.put('/:id', uploadReceiptFile, handleUpdateReceipt);
router.delete('/:id', handleDeleteReceipt);

export default router;
