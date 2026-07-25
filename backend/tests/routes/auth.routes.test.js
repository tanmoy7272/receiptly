import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Auth Routes Integration (Unauthorized Access)', () => {
  it('returns 401 Unauthorized when requesting protected /api/v1/auth/me without token', async () => {
    const response = await request(app).get('/api/v1/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.error.message).toContain('Authentication required');
  });

  it('validates missing required fields on registration', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'invalid-email', password: '123' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBeDefined();
  });
});
