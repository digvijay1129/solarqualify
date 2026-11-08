import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('SolarQualify API application', () => {
  it('returns a successful health check', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'SolarQualify API is healthy.',
      data: {
        service: 'solarqualify-api',
        status: 'ok',
      },
    });

    expect(response.body.data.timestamp).toBeTypeOf('string');
  });

  it('returns a consistent JSON response for unknown routes', async () => {
    const response = await request(app)
      .get('/api/v1/does-not-exist')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Route not found: GET /api/v1/does-not-exist',
    });
  });

  it('rejects malformed JSON with a client error', async () => {
    const response = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{invalid-json')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeTypeOf('string');
  });
});