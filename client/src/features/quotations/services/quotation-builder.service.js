import { apiRequest } from "../../../services/api/api-client.js";
import { getLeads, getLeadById, getLeadQualification } from "../../leads/services/leads.service.js";
import { fetchPricingSubsidyConfiguration } from "../../pricing/services/pricing-subsidy.service.js";

function unwrap(response) {
  return response?.data ?? response;
}

export async function getQuotationBuilderData() {
  const [leadResponse, rules] = await Promise.all([
    getLeads({ page: 1, pageSize: 20, status: "all" }),
    fetchPricingSubsidyConfiguration(),
  ]);
  return {
    dataMode: "live",
    dataLabel: "Lead, qualification and business-rule data retrieved from SolarQualify APIs.",
    leads: leadResponse.items ?? [],
    pagination: leadResponse.pagination ?? null,
    rules,
  };
}

export async function getQuotationLeadContext(leadId) {
  if (!leadId) throw new Error("Select a lead first.");
  const [lead, qualification] = await Promise.all([
    getLeadById(leadId),
    getLeadQualification(leadId),
  ]);
  return { lead, qualification };
}

export async function getSavedLeadQuotations(leadId) {
  if (!leadId) throw new Error("A lead ID is required.");
  const result = unwrap(await apiRequest(`/leads/${leadId}/quotations?limit=20`));
  return result?.quotations ?? [];
}

export async function createFormalQuotation(leadId, activeRules, effectiveOn = new Date().toISOString().slice(0, 10)) {
  if (!leadId) throw new Error("Select a lead before generating a quotation.");
  if (!activeRules?.pricing?.id || !activeRules?.generation?.id) {
    throw new Error("One active pricing rule and one active generation rule are required.");
  }

  const payload = {
    effectiveOn,
    pricingRuleId: activeRules.pricing.id,
    generationRuleId: activeRules.generation.id,
  };
  if (activeRules.subsidies?.id) payload.subsidyRuleId = activeRules.subsidies.id;

  const result = unwrap(await apiRequest(`/leads/${leadId}/quotations`, {
    method: "POST",
    body: payload,
  }));
  return result?.quotation ?? null;
}

export async function downloadSavedQuotationPdf(quotationId) {
  if (!quotationId) throw new Error("A quotation ID is required.");
  return apiRequest(`/quotations/${quotationId}/pdf`, {
    responseType: "blob",
  });
}
