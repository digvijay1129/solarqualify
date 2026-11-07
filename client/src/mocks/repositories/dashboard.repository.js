import { dashboardOverviewFixture } from "../fixtures/dashboard.fixture.js";

/**
 * Local demo repository.
 * Replace this implementation with an API-backed repository
 * during backend integration.
 */
export const dashboardRepository = {
  async getOverview() {
    return structuredClone(dashboardOverviewFixture);
  },
};