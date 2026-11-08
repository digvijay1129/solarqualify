import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { authorize } from '../src/middleware/authorize.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

function createTestApp() {
  const app = express();

  // Simulates the authenticated user provided by JWT middleware.
  app.use((req, res, next) => {
    const role = req.headers['x-test-role'];

    req.user = role
      ? { id: 'test-user-id', role }
      : undefined;

    next();
  });

  app.get(
    '/homeowner',
    authorize('homeowner'),
    (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Homeowner access granted.',
      });
    }
  );

  app.get(
    '/sales',
    authorize('salesStaff'),
    (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Sales staff access granted.',
      });
    }
  );

  app.use(errorHandler);

  return app;
}

describe('RBAC Express Route Integration', () => {
  const app = createTestApp();

  it('should allow a homeowner to access the homeowner route', async () => {
    const response = await request(app)
      .get('/homeowner')
      .set('x-test-role', 'homeowner')
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should deny sales staff access to the homeowner-only route', async () => {
    const response = await request(app)
      .get('/homeowner')
      .set('x-test-role', 'salesStaff')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: 'You do not have permission to perform this action.',
    });
  });

  it('should allow sales staff to access the sales route', async () => {
    const response = await request(app)
      .get('/sales')
      .set('x-test-role', 'salesStaff')
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should deny homeowners access to the sales-only route', async () => {
    const response = await request(app)
      .get('/sales')
      .set('x-test-role', 'homeowner')
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  it('should deny requests without an authenticated user', async () => {
    const response = await request(app)
      .get('/sales')
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Authentication required.',
    });
  });
});