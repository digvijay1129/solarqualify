import { getHomeownerPortalDemoData } from "../../../mocks/repositories/homeowner-portal.repository.js";

export async function getHomeownerPortalSession() {
  return getHomeownerPortalDemoData();
}

export const HOMEOWNER_API_STATUS = Object.freeze({
  connected: false,
  note: "Replace this demo repository with authenticated homeowner APIs during backend integration.",
});
