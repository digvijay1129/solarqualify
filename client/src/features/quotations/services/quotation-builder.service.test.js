import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/api/api-client.js", () => ({
  apiRequest: vi.fn(),
}));
vi.mock("../../leads/services/leads.service.js", () => ({
  getLeads: vi.fn(),
  getLeadById: vi.fn(),
  getLeadQualification: vi.fn(),
}));
vi.mock("../../pricing/services/pricing-subsidy.service.js", () => ({
  fetchPricingSubsidyConfiguration: vi.fn(),
}));

import { apiRequest } from "../../../services/api/api-client.js";
import { getLeads, getLeadById, getLeadQualification } from "../../leads/services/leads.service.js";
import { fetchPricingSubsidyConfiguration } from "../../pricing/services/pricing-subsidy.service.js";
import {
  createFormalQuotation,
  downloadSavedQuotationPdf,
  getQuotationBuilderData,
  getQuotationLeadContext,
  getSavedLeadQuotations,
} from "./quotation-builder.service.js";

describe("Quotation Builder API integration service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads authorized leads and versioned business rules", async () => {
    getLeads.mockResolvedValue({ items: [{ id: "lead-1" }], pagination: { totalItems: 1 } });
    fetchPricingSubsidyConfiguration.mockResolvedValue({ activeRules: {} });

    const result = await getQuotationBuilderData();

    expect(result.dataMode).toBe("live");
    expect(result.leads).toEqual([{ id: "lead-1" }]);
    expect(getLeads).toHaveBeenCalledWith({ page: 1, pageSize: 20, status: "all" });
    expect(fetchPricingSubsidyConfiguration).toHaveBeenCalledOnce();
  });

  it("loads a lead detail and its saved qualification result", async () => {
    getLeadById.mockResolvedValue({ id: "lead-1" });
    getLeadQualification.mockResolvedValue({ leadScore: 78 });
    await expect(getQuotationLeadContext("lead-1")).resolves.toEqual({
      lead: { id: "lead-1" },
      qualification: { leadScore: 78 },
    });
    expect(getLeadById).toHaveBeenCalledWith("lead-1");
    expect(getLeadQualification).toHaveBeenCalledWith("lead-1");
  });

  it("retrieves saved formal quotations from the selected lead", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { quotations: [{ id: "q1" }] } });
    await expect(getSavedLeadQuotations("lead-1")).resolves.toEqual([{ id: "q1" }]);
    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1/quotations?limit=20");
  });

  it("creates a quotation using active effective rule IDs", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { quotation: { id: "q1", quotationNumber: "SQ-TEST" } } });
    const activeRules = {
      pricing: { id: "price-1" },
      generation: { id: "generation-1" },
      subsidies: { id: "subsidy-1" },
    };

    await expect(createFormalQuotation("lead-1", activeRules, "2026-11-09")).resolves.toMatchObject({
      id: "q1",
      quotationNumber: "SQ-TEST",
    });
    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1/quotations", {
      method: "POST",
      body: {
        effectiveOn: "2026-11-09",
        pricingRuleId: "price-1",
        generationRuleId: "generation-1",
        subsidyRuleId: "subsidy-1",
      },
    });
  });

  it("omits subsidy rule ID when no verified active subsidy exists", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { quotation: { id: "q2" } } });
    await createFormalQuotation("lead-1", {
      pricing: { id: "price-1" },
      generation: { id: "generation-1" },
      subsidies: null,
    }, "2026-11-09");

    expect(apiRequest.mock.calls[0][1].body).toEqual({
      effectiveOn: "2026-11-09",
      pricingRuleId: "price-1",
      generationRuleId: "generation-1",
    });
  });

  it("downloads a saved quotation as a PDF blob", async () => {
    const pdf = new Blob(["pdf"], { type: "application/pdf" });
    apiRequest.mockResolvedValue(pdf);
    await expect(downloadSavedQuotationPdf("q1")).resolves.toBe(pdf);
    expect(apiRequest).toHaveBeenCalledWith("/quotations/q1/pdf", { responseType: "blob" });
  });
});
