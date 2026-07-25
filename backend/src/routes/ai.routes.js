import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { uploadReceiptFile } from '../middlewares/upload.middleware.js';
import { handleExtractReceipt, handleExtractFileAI } from '../controllers/ai.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/extract-file', uploadReceiptFile, handleExtractFileAI);
router.post('/:id/extract', handleExtractReceipt);

export default router;
