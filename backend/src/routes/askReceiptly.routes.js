/**
 * ============================================================================
 * Ask Receiptly API Routes
 * ============================================================================
 * Purpose: Public Express routes for Ask Receiptly (POST /api/v1/ask).
 * ============================================================================
 */
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { handleAskReceiptly } from '../controllers/askReceiptly.controller.js';

const router = Router();

router.post('/', requireAuth, handleAskReceiptly);

export default router;
