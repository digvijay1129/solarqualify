import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

vi.mock('../src/modules/users/user.model.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

import User from '../src/modules/users/user.model.js';
import { env } from '../src/config/env.js';
import app from '../src/app.js';

const USER_ID = '507f1f77bcf86cd799439011';

function createToken(overrides = {}, options = {}) {
  return jwt.sign(
    { role: 'homeowner', ...overrides },
    env.JWT_SECRET,
    {
      subject: USER_ID,
      expiresIn: '1h',
      issuer: 'solarqualify-api',
      ...options,
    }
  );
}

function mockUserLookup(user) {
  const query = {
    select: vi.fn().mockResolvedValue(user),
  };

  User.findById.mockReturnValue(query);

  return query;
}

function createActiveUser(overrides = {}) {
  return {
    _id: { toString: () => USER_ID },
    name: 'Test Homeowner',
    email: 'homeowner@example.com',
    role: 'homeowner',
    phone: '9876543210',
    isActive: true,
    ...overrides,
  };
}

describe('JWT Authentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject requests without an authorization header', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Authentication required.',
    });

    expect(User.findById).not.toHaveBeenCalled();
  });

  it('should reject malformed authorization headers', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Token invalid-token')
      .expect(401);

    expect(response.body.message).toBe('Invalid authorization format.');
  });

  it('should reject invalid JWT tokens', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body.message).toBe(
      'Invalid or expired access token.'
    );
  });

  it('should reject expired JWT tokens', async () => {
    const expiredToken = createToken({}, { expiresIn: '-1s' });

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.message).toBe(
      'Invalid or expired access token.'
    );
  });

  it('should reject tokens when the user no longer exists', async () => {
    mockUserLookup(null);

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(401);

    expect(response.body.message).toBe('User account is unavailable.');
  });

  it('should reject inactive user accounts', async () => {
    mockUserLookup(createActiveUser({ isActive: false }));

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(401);

    expect(response.body.message).toBe('User account is unavailable.');
  });

  it('should return the authenticated user profile', async () => {
    const query = mockUserLookup(createActiveUser());

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200);

    expect(query.select).toHaveBeenCalledWith(
      'name email role phone isActive'
    );

    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: {
          id: USER_ID,
          name: 'Test Homeowner',
          email: 'homeowner@example.com',
          role: 'homeowner',
          phone: '9876543210',
        },
      },
    });

    expect(response.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('should allow an authenticated user to log out', async () => {
    mockUserLookup(createActiveUser());

    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Logout successful. Remove the access token from the client.',
    });
  });
});