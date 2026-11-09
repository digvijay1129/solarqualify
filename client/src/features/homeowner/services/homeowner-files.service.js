import { apiRequest } from "../../../services/api/api-client.js";

export async function downloadHomeownerQuotationPdf(quotationId) {
  if (!quotationId) throw new Error("A quotation ID is required.");
  return apiRequest(`/quotations/${quotationId}/pdf`, {
    responseType: "blob",
  });
}

export async function downloadHomeownerBill(leadId) {
  if (!leadId) throw new Error("A lead ID is required.");
  return apiRequest(`/leads/${leadId}/bill/download`, {
    responseType: "blob",
  });
}
