import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import {
  getCurrentUser,
  login,
  logout,
  register,
} from './auth.controller.js';

import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
    });
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;