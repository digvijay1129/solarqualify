import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import leadRoutes from '../modules/leads/lead.routes.js';
import ruleRoutes from '../modules/pricing-rules/rule-management.routes.js';
import quotationRoutes from '../modules/quotations/quotation.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/rules', ruleRoutes);
router.use('/quotations', quotationRoutes);

export default router;