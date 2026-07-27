import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { getReceiptInsights } from '../../src/services/receiptInsights.service.js';

describe('Receipt AI Insights Routes & Service', () => {
  it('GET /api/v1/receipts/:id/insights should require authentication', async () => {
    const response = await request(app).get('/api/v1/receipts/test-id/insights');
    expect(response.status).toBe(401);
  });

  it('getReceiptInsights should return enabled: false and empty array for non-existent receipt or unowned receipt', async () => {
    const result = await getReceiptInsights('non-existent-receipt-id', 'dummy-user-id');
    expect(result).toEqual({
      enabled: false,
      insights: [],
    });
  });

  it('getReceiptInsights should return enabled: false when receipt lacks sufficient metadata threshold', async () => {
    // Calling with empty or minimal parameters should fail metadata guard
    const result = await getReceiptInsights('', '');
    expect(result).toEqual({
      enabled: false,
      insights: [],
    });
  });
});
