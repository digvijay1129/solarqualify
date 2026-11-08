import { describe, expect, it } from 'vitest';
import User from '../src/modules/users/user.model.js';

describe('User Model', () => {
  it('should create a valid homeowner with default role', async () => {
    const user = new User({
      name: 'Test Homeowner',
      email: 'homeowner@example.com',
      passwordHash: 'hashed-password',
    });

    await expect(user.validate()).resolves.toBeUndefined();
    expect(user.role).toBe('homeowner');
    expect(user.isActive).toBe(true);
  });

  it('should normalize email to lowercase and trim whitespace', () => {
    const user = new User({
      name: 'Test Homeowner',
      email: '  HOMEOWNER@EXAMPLE.COM  ',
      passwordHash: 'hashed-password',
    });

    expect(user.email).toBe('homeowner@example.com');
  });

  it('should reject an invalid email address', async () => {
    const user = new User({
      name: 'Test Homeowner',
      email: 'invalid-email',
      passwordHash: 'hashed-password',
    });

    await expect(user.validate()).rejects.toHaveProperty('errors.email');
  });

  it('should reject an unsupported user role', async () => {
    const user = new User({
      name: 'Test User',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      role: 'admin',
    });

    await expect(user.validate()).rejects.toHaveProperty('errors.role');
  });

  it('should require a password hash', async () => {
    const user = new User({
      name: 'Test User',
      email: 'user@example.com',
    });

    await expect(user.validate()).rejects.toHaveProperty('errors.passwordHash');
  });

  it('should exclude passwordHash from query results by default', () => {
    expect(User.schema.path('passwordHash').options.select).toBe(false);
  });
});
