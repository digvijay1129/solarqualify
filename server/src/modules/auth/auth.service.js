import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../users/user.model.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';

const BCRYPT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function validateRegistrationInput({ name, email, password, phone }) {
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    throw new AppError('Name must contain between 2 and 100 characters.', 400);
  }

  if (!EMAIL_PATTERN.test(normalizeEmail(email))) {
    throw new AppError('Enter a valid email address.', 400);
  }

  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new AppError(
      'Password must contain at least 8 characters and no more than 72 UTF-8 bytes.',
      400
    );
  }

  if (
    phone !== undefined &&
    (typeof phone !== 'string' || phone.trim().length > 20)
  ) {
    throw new AppError('Phone number must not exceed 20 characters.', 400);
  }
}

function createAccessToken(user) {
  return jwt.sign(
    { role: user.role },
    env.JWT_SECRET,
    {
      subject: user._id.toString(),
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'solarqualify-api',
    }
  );
}

function getSafeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export async function registerUser(input) {
  validateRegistrationInput(input);

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone?.trim() ?? '';

  const existingUser = await User.findOne({ email }).select('_id');

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: 'homeowner',
    });

    return {
      user: getSafeUser(user),
      accessToken: createAccessToken(user),
      tokenType: 'Bearer',
    };
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('An account with this email already exists.', 409);
    }

    throw error;
  }
}

export async function loginUser({ email: rawEmail, password }) {
  const email = normalizeEmail(rawEmail);

  if (!EMAIL_PATTERN.test(email) || typeof password !== 'string' || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password.', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password.', 401);
  }

  return {
    user: getSafeUser(user),
    accessToken: createAccessToken(user),
    tokenType: 'Bearer',
  };
}