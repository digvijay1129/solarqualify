import { AppError } from '../shared/errors/AppError.js';

const allowedRoles = new Set(['homeowner', 'salesStaff']);

export function authorize(...roles) {
  if (roles.length === 0) {
    throw new Error('At least one allowed role must be specified.');
  }

  const invalidRoles = roles.filter((role) => !allowedRoles.has(role));

  if (invalidRoles.length > 0) {
    throw new Error(`Unsupported authorization role: ${invalidRoles.join(', ')}`);
  }

  return function roleAuthorization(req, res, next) {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403
      );
    }

    return next();
  };
}