import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { getDashboardAiSummary } from '../../src/services/dashboardAi.service.js';

describe('Dashboard AI Insights Routes & Service', () => {
  it('GET /api/v1/dashboard/insights should require authentication', async () => {
    const response = await request(app).get('/api/v1/dashboard/insights');
    expect(response.status).toBe(401);
  });

  it('getDashboardAiSummary should return enabled: false and empty summary when user has 0 receipts', async () => {
    // Test direct service response with dummy userId or missing receipts
    const result = await getDashboardAiSummary('non-existent-user-id');
    expect(result).toEqual({
      enabled: false,
      summary: [],
    });
  });
});
