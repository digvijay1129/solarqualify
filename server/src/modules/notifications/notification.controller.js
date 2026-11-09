import { getProjectNotifications } from './notification.service.js';

export async function getProjectNotificationsController(req, res) {
  const result = await getProjectNotifications(
    req.user,
    req.params.projectId,
    req.query
  );
  return res.status(200).json({
    success: true,
    message: 'Project notification history retrieved successfully.',
    data: result,
  });
}