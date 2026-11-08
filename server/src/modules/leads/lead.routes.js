import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

import {
  assignLeadController,
  createLeadController,
  getLeadByIdController,
  getLeadsController,
  getLeadsOverviewController,
  updateLeadController,
} from './lead.controller.js';

const router = Router();

const leadWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// Every Leads endpoint requires authentication.
router.use(authenticate);

// Overview must be declared before the dynamic lead ID route.
router.get(
  '/overview',
  authorize('homeowner', 'salesStaff'),
  getLeadsOverviewController
);

router.get(
  '/',
  authorize('homeowner', 'salesStaff'),
  getLeadsController
);

router.post(
  '/',
  leadWriteLimiter,
  authorize('homeowner', 'salesStaff'),
  createLeadController
);

router.patch(
  '/:leadId/assignment',
  leadWriteLimiter,
  authorize('salesStaff'),
  assignLeadController
);

router.patch(
  '/:leadId',
  leadWriteLimiter,
  authorize('homeowner', 'salesStaff'),
  updateLeadController
);

router.get(
  '/:leadId',
  authorize('homeowner', 'salesStaff'),
  getLeadByIdController
);

export default router;