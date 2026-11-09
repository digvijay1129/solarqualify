import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { getAuditLogsController } from './audit-log.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('salesStaff'));
router.get('/', getAuditLogsController);

export default router;