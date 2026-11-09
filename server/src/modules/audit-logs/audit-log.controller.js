import { getAuditLogs } from './audit-log.service.js';

export async function getAuditLogsController(req, res) {
  const result = await getAuditLogs(req.user, req.query);
  return res.status(200).json({
    success: true,
    message: 'Audit logs retrieved successfully.',
    data: result,
  });
}