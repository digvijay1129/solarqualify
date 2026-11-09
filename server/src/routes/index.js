import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import leadRoutes from '../modules/leads/lead.routes.js';
import ruleRoutes from '../modules/pricing-rules/rule-management.routes.js';
import quotationRoutes from '../modules/quotations/quotation.routes.js';
import projectRoutes from '../modules/projects/project.routes.js';
import publicProjectStatusRoutes from '../modules/projects/public-project-status.routes.js';
import auditLogRoutes from '../modules/audit-logs/audit-log.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/rules', ruleRoutes);
router.use('/quotations', quotationRoutes);
router.use('/projects', projectRoutes);
router.use('/public/project-status', publicProjectStatusRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;