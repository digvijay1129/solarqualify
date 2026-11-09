import { getDashboardAnalytics } from './analytics.service.js';

export async function getDashboardAnalyticsController(req, res) {
  const analytics = await getDashboardAnalytics(req.user, req.query);
  return res.status(200).json({
    success: true,
    message: 'Dashboard analytics retrieved successfully.',
    data: { analytics },
  });
}