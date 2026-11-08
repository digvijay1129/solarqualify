import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Authentication API', () => {
  it('should reject registration when required fields are missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({})
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Name must contain between 2 and 100 characters.',
    });
  });

  it('should reject registration with an invalid email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Homeowner',
        email: 'invalid-email',
        password: 'StrongPassword123',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Enter a valid email address.');
  });

  it('should reject login when email and password are missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({})
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Email and password are required.',
    });
  });
});