import { dashboardRepository } from "../../../mocks/repositories/dashboard.repository.js";

/**
 * Dashboard data service.
 * Currently uses the local demo repository.
 * Replace the repository implementation with API access
 * when the backend integration phase begins.
 */
export async function getDashboardOverview() {
  return dashboardRepository.getOverview();
}