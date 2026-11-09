import { apiRequest } from "../../../services/api/api-client.js";

function unwrap(response) {
  return response?.data ?? response;
}

export async function getBillAnalysisLeads(search = "") {
  const params = new URLSearchParams({
    page: "1",
    pageSize: "20",
    status: "all",
  });
  if (search.trim()) params.set("search", search.trim());
  return unwrap(await apiRequest(`/leads?${params.toString()}`));
}

export async function confirmBillLeadAssignment(leadId, salesStaffId) {
  const result = unwrap(await apiRequest(`/leads/${leadId}/assignment`, {
    method: "PATCH",
    body: { salesStaffId },
  }));
  return result?.lead ?? null;
}

export async function getBillDocumentMetadata(leadId) {
  const result = unwrap(await apiRequest(`/leads/${leadId}/bill`));
  return result?.bill ?? null;
}

export async function uploadBillDocument(leadId, file) {
  const body = new FormData();
  body.append("bill", file);
  const result = unwrap(await apiRequest(`/leads/${leadId}/bill`, {
    method: "POST",
    body,
  }));
  return result?.bill ?? null;
}

export async function runBillOcr(leadId) {
  const result = unwrap(await apiRequest(`/leads/${leadId}/bill/analyze`, {
    method: "POST",
  }));
  return result?.analysis ?? null;
}

export async function getBillReview(leadId) {
  const result = unwrap(await apiRequest(`/leads/${leadId}/bill/review`));
  return result?.analysis ?? null;
}

export async function submitBillVerification(leadId, payload) {
  const result = unwrap(await apiRequest(`/leads/${leadId}/bill/verification`, {
    method: "PATCH",
    body: payload,
  }));
  return result?.analysis ?? null;
}

export async function downloadBillDocument(leadId) {
  if (!leadId) throw new Error("A lead ID is required.");
  return apiRequest(`/leads/${leadId}/bill/download`, {
    responseType: "blob",
  });
}

export async function deleteBillDocument(leadId) {
  if (!leadId) throw new Error("A lead ID is required.");
  return apiRequest(`/leads/${leadId}/bill`, { method: "DELETE" });
}
