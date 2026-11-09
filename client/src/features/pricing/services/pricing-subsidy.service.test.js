import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/api/api-client.js", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/api-client.js";
import {
  createRuleVersion,
  fetchPricingSubsidyConfiguration,
  updateRuleVersionStatus,
  verifySubsidyRule,
} from "./pricing-subsidy.service.js";

describe("Pricing and Subsidy API integration service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads pricing, subsidy and generation rules from the real API", async () => {
    const today = new Date().toISOString().slice(0, 10);
    apiRequest
      .mockResolvedValueOnce({ success: true, data: { rules: [{
        id: "price-1", ruleName: "Residential Pricing", version: 2,
        pricePerKW: 42000, installationCharges: 12000,
        effectiveFrom: "2020-01-01T00:00:00.000Z", effectiveTo: null, status: "active",
      }] } })
      .mockResolvedValueOnce({ success: true, data: { rules: [{
        id: "subsidy-1", ruleName: "Verified Subsidy", version: 1,
        slabs: [{ upToKW: 2, amountPerKW: 30000 }, { upToKW: 3, amountPerKW: 18000 }],
        maximumSubsidy: 78000, effectiveFrom: "2020-01-01T00:00:00.000Z",
        effectiveTo: null, status: "active", verificationStatus: "verified",
      }] } })
      .mockResolvedValueOnce({ success: true, data: { rules: [{
        id: "generation-1", ruleName: "Demo Generation", version: 3,
        unitsPerKWPerYear: 1450, effectiveFrom: "2020-01-01T00:00:00.000Z",
        effectiveTo: null, status: "active",
      }] } });

    const result = await fetchPricingSubsidyConfiguration();

    expect(result.dataMode).toBe("live");
    expect(result.activeRules.pricing).toMatchObject({ id: "price-1", version: 2 });
    expect(result.activeRules.subsidies).toMatchObject({ id: "subsidy-1", verificationStatus: "verified" });
    expect(result.activeRules.generation).toMatchObject({ id: "generation-1", unitsPerKWPerYear: 1450 });
    expect(result.rates[2]).toMatchObject({ systemSizeKw: 3, equipmentCost: 126000, installationCost: 12000, approvalStatus: "active" });
    expect(result.generation.unitsPerKwPerYear).toBe(1450);
    expect(apiRequest).toHaveBeenNthCalledWith(1, "/rules/pricing?limit=100");
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/rules/subsidies?limit=100");
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/rules/generation?limit=100");
    expect(result.referenceDate).toBe(today);
  });

  it("does not treat an unverified subsidy draft as an active quotation subsidy", async () => {
    apiRequest
      .mockResolvedValueOnce({ success: true, data: { rules: [] } })
      .mockResolvedValueOnce({ success: true, data: { rules: [{
        id: "subsidy-draft", ruleName: "Draft", version: 1,
        slabs: [{ upToKW: 2, amountPerKW: 30000 }],
        maximumSubsidy: 60000, status: "draft", verificationStatus: "unverified",
        effectiveFrom: "2020-01-01T00:00:00.000Z",
      }] } })
      .mockResolvedValueOnce({ success: true, data: { rules: [] } });

    const result = await fetchPricingSubsidyConfiguration();

    expect(result.activeRules.subsidies).toBeNull();
    expect(result.subsidyRule).toMatchObject({
      id: "subsidy-draft",
      status: "draft",
      verificationStatus: "unverified",
    });
    expect(result.generation.unitsPerKWPerYear).toBeNull();
    expect(result.activeRules.pricing).toBeNull();
  });

  it("creates a numeric business rule version as a backend draft", async () => {
    const payload = { ruleName: "Generation", effectiveFrom: "2026-12-01", status: "draft", unitsPerKWPerYear: 1400 };
    apiRequest.mockResolvedValue({ success: true, data: { rule: { id: "rule-1", version: 1, status: "draft" } } });

    await expect(createRuleVersion("generation", payload)).resolves.toMatchObject({ id: "rule-1", version: 1, status: "draft" });
    expect(apiRequest).toHaveBeenCalledWith("/rules/generation", { method: "POST", body: payload });
  });

  it("persists activation/deactivation through the rule status endpoint", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { rule: { id: "rule-1", status: "active" } } });

    await updateRuleVersionStatus("pricing", "rule-1", { status: "active" });
    expect(apiRequest).toHaveBeenCalledWith("/rules/pricing/rule-1/status", {
      method: "PATCH",
      body: { status: "active" },
    });
  });

  it("uses the dedicated subsidy verification endpoint before activation", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { rule: { id: "subsidy-1", verificationStatus: "verified" } } });

    await verifySubsidyRule("subsidy-1", "verified");
    expect(apiRequest).toHaveBeenCalledWith("/rules/subsidies/subsidy-1/verification", {
      method: "PATCH",
      body: { decision: "verified" },
    });
  });
});
