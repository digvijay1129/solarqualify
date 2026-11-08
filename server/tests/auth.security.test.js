import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/users/user.model.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

import User from '../src/modules/users/user.model.js';
import { registerUser, loginUser } from '../src/modules/auth/auth.service.js';

const validRegistration = {
  name: 'Test Homeowner',
  email: 'homeowner@example.com',
  password: 'StrongPassword123',
};

function mockUserLookup(user) {
  User.findOne.mockReturnValue({
    select: vi.fn().mockResolvedValue(user),
  });
}

describe('Authentication Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject passwords exceeding bcrypt’s 72-byte limit', async () => {
    const password = 'é'.repeat(37);

    expect(Buffer.byteLength(password, 'utf8')).toBeGreaterThan(72);

    await expect(
      registerUser({
        ...validRegistration,
        password,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });

  it('should handle duplicate-email database races safely', async () => {
    mockUserLookup(null);

    User.create.mockRejectedValue({
      code: 11000,
    });

    await expect(
      registerUser(validRegistration)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'An account with this email already exists.',
    });
  });

  it('should reject login for inactive accounts using a generic error', async () => {
    mockUserLookup({
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      email: 'homeowner@example.com',
      passwordHash: 'unused-password-hash',
      isActive: false,
    });

    await expect(
      loginUser({
        email: 'homeowner@example.com',
        password: 'StrongPassword123',
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password.',
    });
  });
});