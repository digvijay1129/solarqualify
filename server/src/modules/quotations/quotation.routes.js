import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { getQuotationController, downloadQuotationPdfController } from './quotation.controller.js';
import { rateLimit } from 'express-rate-limit';
import { createProjectFromQuotationController } from '../projects/project.controller.js';

const router = Router();
router.use(authenticate);
router.use(authorize('homeowner', 'salesStaff'));

const projectCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/:quotationId/project',
  projectCreationLimiter,
  authorize('salesStaff'),
  createProjectFromQuotationController
);
router.get('/:quotationId/pdf', downloadQuotationPdfController);
router.get('/:quotationId', getQuotationController);
export default router;