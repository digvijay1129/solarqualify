
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

import { uploadBill } from '../bills/bill-upload.middleware.js';

import {
  uploadBillDocumentController,
  getBillDocumentMetadataController,
  downloadBillDocumentController,
  deleteBillDocumentController,
  analyzeBillDocumentController,
  getBillAnalysisForReviewController,
  verifyBillAnalysisController,
} from '../bills/bill.controller.js';

const router = Router();

const leadWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// OCR is resource-intensive.
const billAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Bill verification changes business data.
const billVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
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

// Bill document upload.
router.post(
  '/:leadId/bill',
  leadWriteLimiter,
  authorize('homeowner', 'salesStaff'),
  uploadBill,
  uploadBillDocumentController
);

// Bill OCR analysis.
router.post(
  '/:leadId/bill/analyze',
  billAnalysisLimiter,
  authorize('homeowner', 'salesStaff'),
  analyzeBillDocumentController
);

// Bill review - Sales Staff only.
router.get(
  '/:leadId/bill/review',
  authorize('salesStaff'),
  getBillAnalysisForReviewController
);

// Manual bill verification or rejection - Sales Staff only.
router.patch(
  '/:leadId/bill/verification',
  billVerificationLimiter,
  authorize('salesStaff'),
  verifyBillAnalysisController
);

// Bill document download.
router.get(
  '/:leadId/bill/download',
  authorize('homeowner', 'salesStaff'),
  downloadBillDocumentController
);

// Bill metadata.
router.get(
  '/:leadId/bill',
  authorize('homeowner', 'salesStaff'),
  getBillDocumentMetadataController
);

// Bill document deletion.
router.delete(
  '/:leadId/bill',
  leadWriteLimiter,
  authorize('homeowner', 'salesStaff'),
  deleteBillDocumentController
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
