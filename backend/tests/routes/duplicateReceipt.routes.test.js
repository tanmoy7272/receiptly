import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import receiptRoutes from '../../src/routes/receipt.routes.js';
import { errorHandler } from '../../src/middlewares/error.middleware.js';
import * as duplicateService from '../../src/services/duplicateReceipt.service.js';

vi.mock('../../src/middlewares/auth.middleware.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/v1/receipts', receiptRoutes);
app.use(errorHandler);

describe('Duplicate Receipt Detection API Endpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/v1/receipts/check-duplicate returns duplicate check result', async () => {
    const mockResult = {
      isDuplicate: true,
      confidence: 'high',
      reason: 'invoice_match',
      candidate: {
        id: 'candidate-id-1',
        title: 'MacBook Air',
        merchant: 'Apple',
        amount: 99900,
        purchaseDate: '2026-05-20',
      },
    };

    vi.spyOn(duplicateService, 'checkDuplicateReceipt').mockResolvedValue(mockResult);

    const response = await request(app)
      .post('/api/v1/receipts/check-duplicate')
      .send({
        merchant: 'Apple Store',
        amount: 99900,
        purchaseDate: '2026-05-20',
        invoiceNumber: 'INV-999',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.isDuplicate).toBe(true);
    expect(response.body.reason).toBe('invoice_match');
    expect(response.body.candidate.id).toBe('candidate-id-1');
  });

  it('POST /api/v1/receipts/check-duplicate validates missing required fields', async () => {
    const response = await request(app)
      .post('/api/v1/receipts/check-duplicate')
      .send({
        title: 'Test',
      });

    expect(response.status).toBe(400);
  });
});
