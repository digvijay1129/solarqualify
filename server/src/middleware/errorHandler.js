import { env } from '../config/env.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number(error.statusCode ?? error.status) || 500;
  const isServerError = statusCode >= 500;
  const message = isServerError && env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error.message || 'An unexpected error occurred.';

  if (isServerError) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { errors: error.details } : {}),
  });
}
