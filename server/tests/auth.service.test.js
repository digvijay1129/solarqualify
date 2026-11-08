import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../src/modules/users/user.model.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

import User from '../src/modules/users/user.model.js';
import { env } from '../src/config/env.js';
import { AppError } from '../src/shared/errors/AppError.js';
import {
  loginUser,
  registerUser,
} from '../src/modules/auth/auth.service.js';

const USER_ID = '507f1f77bcf86cd799439011';
const PASSWORD = 'StrongPassword123';

function createUser(overrides = {}) {
  return {
    _id: { toString: () => USER_ID },
    name: 'Test Homeowner',
    email: 'homeowner@example.com',
    phone: '9876543210',
    role: 'homeowner',
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  };
}

function mockUserLookup(user) {
  const query = {
    select: vi.fn().mockResolvedValue(user),
  };

  User.findOne.mockReturnValue(query);

  return query;
}

describe('Authentication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a homeowner with a hashed password and JWT', async () => {
    mockUserLookup(null);

    let createdUser;

    User.create.mockImplementation(async (input) => {
      createdUser = createUser(input);
      return createdUser;
    });

    const result = await registerUser({
      name: 'Test Homeowner',
      email: ' HOMEOWNER@EXAMPLE.COM ',
      password: PASSWORD,
      phone: '9876543210',
      role: 'salesStaff',
    });

    expect(User.findOne).toHaveBeenCalledWith({
      email: 'homeowner@example.com',
    });

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'homeowner@example.com',
        role: 'homeowner',
      })
    );

    expect(createdUser.passwordHash).not.toBe(PASSWORD);
    expect(bcrypt.getRounds(createdUser.passwordHash)).toBe(12);
    await expect(
      bcrypt.compare(PASSWORD, createdUser.passwordHash)
    ).resolves.toBe(true);

    expect(result.user.role).toBe('homeowner');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result).toHaveProperty('accessToken');
    expect(result.tokenType).toBe('Bearer');

    const decoded = jwt.verify(result.accessToken, env.JWT_SECRET, {
      issuer: 'solarqualify-api',
      algorithms: ['HS256'],
    });

    expect(decoded.sub).toBe(USER_ID);
    expect(decoded.role).toBe('homeowner');
  });

  it('should reject registration when the email already exists', async () => {
    mockUserLookup(createUser());

    await expect(
      registerUser({
        name: 'Test Homeowner',
        email: 'homeowner@example.com',
        password: PASSWORD,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'An account with this email already exists.',
    });

    expect(User.create).not.toHaveBeenCalled();
  });

  it('should reject passwords shorter than eight characters', async () => {
    await expect(
      registerUser({
        name: 'Test Homeowner',
        email: 'homeowner@example.com',
        password: 'short',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('should log in a user with valid credentials', async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 4);

    const user = createUser({ passwordHash });
    const query = mockUserLookup(user);

    const result = await loginUser({
      email: ' HOMEOWNER@EXAMPLE.COM ',
      password: PASSWORD,
    });

    expect(User.findOne).toHaveBeenCalledWith({
      email: 'homeowner@example.com',
    });

    expect(query.select).toHaveBeenCalledWith('+passwordHash');
    expect(result.user.email).toBe('homeowner@example.com');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result).toHaveProperty('accessToken');
  });

  it('should reject an incorrect password', async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 4);

    mockUserLookup(createUser({ passwordHash }));

    await expect(
      loginUser({
        email: 'homeowner@example.com',
        password: 'WrongPassword123',
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password.',
    });
  });

  it('should return the same generic error for an unknown email', async () => {
    mockUserLookup(null);

    await expect(
      loginUser({
        email: 'unknown@example.com',
        password: PASSWORD,
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password.',
    });
  });
});