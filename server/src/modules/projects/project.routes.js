import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  listProjectsController,
  getProjectController,
  updateProjectStatusController,
  issuePublicProjectStatusTokenController,
  revokePublicProjectStatusTokenController,
} from './project.controller.js';
import { getProjectNotificationsController } from '../notifications/notification.controller.js';

const router = Router();

const projectWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

const tokenManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);
router.use(authorize('homeowner', 'salesStaff'));

router.get('/', listProjectsController);
router.get('/:projectId/notifications', getProjectNotificationsController);
router.get('/:projectId', getProjectController);

// Only assigned Sales Staff can advance milestones or change operational status.
router.patch(
  '/:projectId/status',
  projectWriteLimiter,
  authorize('salesStaff'),
  updateProjectStatusController
);

// Tokens are returned once at issue/rotation and are never persisted in plaintext.
router.post(
  '/:projectId/public-status-token',
  tokenManagementLimiter,
  issuePublicProjectStatusTokenController
);
router.delete(
  '/:projectId/public-status-token',
  tokenManagementLimiter,
  revokePublicProjectStatusTokenController
);

export default router;
