import { apiRequest } from "../../../services/api/api-client.js";

function unwrap(response) {
  return response?.data ?? response;
}

export async function getLeadsOverview() {
  return unwrap(await apiRequest("/leads/overview"));
}

export async function getLeads(filters = {}) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page ?? 1));
  params.set("pageSize", String(filters.pageSize ?? 5));
  params.set("status", filters.status ?? "all");
  params.set("priority", filters.priority ?? "all");
  params.set("location", filters.location ?? "all");

  if (filters.search?.trim()) params.set("search", filters.search.trim());

  return unwrap(await apiRequest(`/leads?${params.toString()}`));
}

export async function getLeadById(leadId) {
  if (!leadId) throw new Error("A lead ID is required.");
  const result = unwrap(await apiRequest(`/leads/${leadId}`));
  return result?.lead ?? null;
}

export async function getLeadQualification(leadId) {
  if (!leadId) throw new Error("A lead ID is required.");

  try {
    const result = unwrap(await apiRequest(`/leads/${leadId}/qualification`));
    return result?.qualification ?? null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function qualifyLead(leadId) {
  if (!leadId) throw new Error("A lead ID is required.");
  const result = unwrap(await apiRequest(`/leads/${leadId}/qualify`, {
    method: "POST",
  }));
  return result?.qualification ?? null;
}

export async function claimLead(leadId, salesStaffId) {
  if (!leadId || !salesStaffId) {
    throw new Error("A lead and signed-in Sales Staff ID are required.");
  }

  const result = unwrap(await apiRequest(`/leads/${leadId}/assignment`, {
    method: "PATCH",
    body: { salesStaffId },
  }));
  return result?.lead ?? null;
}

export async function updateLead(leadId, updates) {
  if (!leadId) throw new Error("A lead ID is required.");
  const result = unwrap(await apiRequest(`/leads/${leadId}`, {
    method: "PATCH",
    body: updates,
  }));
  return result?.lead ?? null;
}
