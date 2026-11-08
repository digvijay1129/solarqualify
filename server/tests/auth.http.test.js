import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const { registerUserMock, loginUserMock } = vi.hoisted(() => ({
  registerUserMock: vi.fn(),
  loginUserMock: vi.fn(),
}));

vi.mock('../src/modules/auth/auth.service.js', () => ({
  registerUser: registerUserMock,
  loginUser: loginUserMock,
}));

import app from '../src/app.js';

const authResult = {
  user: {
    id: '507f1f77bcf86cd799439011',
    name: 'Test Homeowner',
    email: 'homeowner@example.com',
    role: 'homeowner',
    phone: '9876543210',
    isActive: true,
  },
  accessToken: 'mock-access-token',
  tokenType: 'Bearer',
};

describe('Authentication HTTP endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a homeowner and return HTTP 201', async () => {
    registerUserMock.mockResolvedValue(authResult);

    const payload = {
      name: 'Test Homeowner',
      email: 'homeowner@example.com',
      password: 'StrongPassword123',
      phone: '9876543210',
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(payload)
      .expect(201);

    expect(registerUserMock).toHaveBeenCalledWith(payload);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: {
          email: 'homeowner@example.com',
          role: 'homeowner',
        },
        accessToken: 'mock-access-token',
        tokenType: 'Bearer',
      },
    });

    expect(response.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('should log in a homeowner and return HTTP 200', async () => {
    loginUserMock.mockResolvedValue(authResult);

    const payload = {
      email: 'homeowner@example.com',
      password: 'StrongPassword123',
    };

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(payload)
      .expect(200);

    expect(loginUserMock).toHaveBeenCalledWith(payload);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          email: 'homeowner@example.com',
          role: 'homeowner',
        },
        accessToken: 'mock-access-token',
        tokenType: 'Bearer',
      },
    });
  });
});