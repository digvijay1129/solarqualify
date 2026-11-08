import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../modules/users/user.model.js';
import { env } from '../config/env.js';
import { AppError } from '../shared/errors/AppError.js';

export async function authenticate(req, res, next) {
  const authorization = req.get('authorization');

  if (!authorization) {
    throw new AppError('Authentication required.', 401);
  }

  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    throw new AppError('Invalid authorization format.', 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(match[1], env.JWT_SECRET, {
      issuer: 'solarqualify-api',
      algorithms: ['HS256'],
    });
  } catch {
    throw new AppError('Invalid or expired access token.', 401);
  }

  if (
    typeof decoded !== 'object' ||
    !decoded.sub ||
    !mongoose.isValidObjectId(decoded.sub)
  ) {
    throw new AppError('Invalid access token.', 401);
  }

  const user = await User.findById(decoded.sub)
    .select('name email role phone isActive');

  if (!user || !user.isActive) {
    throw new AppError('User account is unavailable.', 401);
  }

  req.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };

  return next();
}