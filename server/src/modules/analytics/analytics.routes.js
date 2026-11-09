import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { getDashboardAnalyticsController } from './analytics.controller.js';

const router = Router();

const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);
router.use(authorize('homeowner', 'salesStaff'));
router.get('/dashboard', analyticsLimiter, getDashboardAnalyticsController);

export default router;