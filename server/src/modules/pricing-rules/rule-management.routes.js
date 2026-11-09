import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

import {
  createRuleVersionController,
  getRuleVersionsController,
  getRuleVersionController,
  updateRuleStatusController,
  verifySubsidyRuleController,
} from './rule-management.controller.js';

const router = Router();

router.use(authenticate);

// Rule history is visible to Homeowners and Sales Staff.
router.get(
  '/:ruleType',
  authorize('homeowner', 'salesStaff'),
  getRuleVersionsController
);

router.get(
  '/:ruleType/:ruleId',
  authorize('homeowner', 'salesStaff'),
  getRuleVersionController
);

// Only Sales Staff can create or manage business rules.
router.post(
  '/:ruleType',
  authorize('salesStaff'),
  createRuleVersionController
);

router.patch(
  '/:ruleType/:ruleId/status',
  authorize('salesStaff'),
  updateRuleStatusController
);

// Subsidy verification is distinct from activation.
router.patch(
  '/subsidies/:ruleId/verification',
  authorize('salesStaff'),
  verifySubsidyRuleController
);

export default router;
