import { leadsRepository } from "../../../mocks/repositories/leads.repository.js";

/**
 * Lead Management service.
 *
 * Currently uses the local mock repository.
 * Replace repository access with backend API calls
 * during backend integration.
 */

export async function getLeadsOverview() {
  return leadsRepository.getOverview();
}

export async function getLeads(filters = {}) {
  return leadsRepository.getLeads(filters);
}

export async function getLeadById(leadId) {
  if (!leadId || typeof leadId !== "string") {
    throw new Error("A valid lead ID is required.");
  }

  return leadsRepository.getLeadById(leadId);
}