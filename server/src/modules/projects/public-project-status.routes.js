import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getPublicProjectStatusController } from './project.controller.js';

const router = Router();

const publicStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/:token', publicStatusLimiter, getPublicProjectStatusController);

export default router;
