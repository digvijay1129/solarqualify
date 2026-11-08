import { describe, expect, it, vi } from 'vitest';
import { authorize } from '../src/middleware/authorize.js';
import { AppError } from '../src/shared/errors/AppError.js';

describe('RBAC Authorization Middleware', () => {
  it('should allow a homeowner on a homeowner-only route', () => {
    const req = { user: { id: 'user-1', role: 'homeowner' } };
    const res = {};
    const next = vi.fn();

    authorize('homeowner')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should allow sales staff on a sales-staff-only route', () => {
    const req = { user: { id: 'user-2', role: 'salesStaff' } };
    const res = {};
    const next = vi.fn();

    authorize('salesStaff')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should allow either configured role', () => {
    const req = { user: { id: 'user-2', role: 'salesStaff' } };
    const res = {};
    const next = vi.fn();

    authorize('homeowner', 'salesStaff')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should deny a homeowner on a sales-staff-only route', () => {
    const req = { user: { id: 'user-1', role: 'homeowner' } };
    const res = {};
    const next = vi.fn();

    expect(() => authorize('salesStaff')(req, res, next)).toThrow(
      expect.objectContaining({
        statusCode: 403,
        message: 'You do not have permission to perform this action.',
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it('should deny sales staff on a homeowner-only route', () => {
    const req = { user: { id: 'user-2', role: 'salesStaff' } };
    const res = {};
    const next = vi.fn();

    expect(() => authorize('homeowner')(req, res, next)).toThrow(
      expect.objectContaining({
        statusCode: 403,
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it('should reject requests without an authenticated user', () => {
    const req = {};
    const res = {};
    const next = vi.fn();

    expect(() => authorize('homeowner')(req, res, next)).toThrow(
      expect.objectContaining({
        statusCode: 401,
        message: 'Authentication required.',
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it('should reject unsupported roles when configuring middleware', () => {
    expect(() => authorize('admin')).toThrow(
      'Unsupported authorization role: admin'
    );
  });
});
