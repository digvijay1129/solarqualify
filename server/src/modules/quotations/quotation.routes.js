import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { getQuotationController, downloadQuotationPdfController } from './quotation.controller.js';

const router = Router();
router.use(authenticate);
router.use(authorize('homeowner', 'salesStaff'));
router.get('/:quotationId/pdf', downloadQuotationPdfController);
router.get('/:quotationId', getQuotationController);
export default router;