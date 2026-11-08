import { homeownerPortalFixture } from "../fixtures/homeowner-portal.fixture.js";

export function getHomeownerPortalDemoData() {
  return structuredClone(homeownerPortalFixture);
}
