import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/api/api-client.js", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/api-client.js";
import {
  analyzeHomeownerBill,
  createHomeownerLead,
  getHomeownerPortalSession,
  mapProject,
  mapQuotation,
  uploadHomeownerBill,
} from "./homeowner-portal.service.js";

describe("homeowner API integration service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads live leads, quotations and project records for the signed-in homeowner", async () => {
    apiRequest
      .mockResolvedValueOnce({ success: true, data: { summary: { totalLeads: 2 } } })
      .mockResolvedValueOnce({ success: true, data: { items: [{ id: "lead-1" }] } })
      .mockResolvedValueOnce({ success: true, data: { projects: [] } })
      .mockResolvedValueOnce({ success: true, data: { quotations: [] } })
      .mockResolvedValueOnce({ success: true, data: { bill: { id: "bill-1" } } });

    const result = await getHomeownerPortalSession({
      id: "user-1",
      name: "Asha Patil",
      email: "asha@example.com",
      phone: "+91 9876543210",
    });

    expect(result.dataMode).toBe("live");
    expect(result.profile.fullName).toBe("Asha Patil");
    expect(result.leads).toHaveLength(1);
    expect(result.documents[0]).toMatchObject({ id: "bill-1", category: "Bills" });
    expect(apiRequest).toHaveBeenCalledWith("/leads/overview");
    expect(apiRequest).toHaveBeenCalledWith("/projects?page=1&pageSize=100");
  });

  it("creates a homeowner lead through the authenticated API", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: { lead: { id: "lead-1", referenceId: "L-TEST1234" } },
    });

    const payload = {
      customerName: "Asha Patil",
      email: "asha@example.com",
      phone: "+91 9876543210",
      propertyAddress: "12 Main Road, Pune, Maharashtra, 411001",
      propertyType: "residential",
      ownership: "owner",
      monthlyElectricityBill: 3200,
      monthlyUnits: 340,
      consent: true,
    };

    await expect(createHomeownerLead(payload)).resolves.toMatchObject({ referenceId: "L-TEST1234" });
    expect(apiRequest).toHaveBeenCalledWith("/leads", { method: "POST", body: payload });
  });

  it("uploads the bill using the backend's required multipart field name", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { bill: { id: "bill-1" } } });
    const file = new File(["bill data"], "electricity.pdf", { type: "application/pdf" });

    await expect(uploadHomeownerBill("lead-1", file)).resolves.toMatchObject({ id: "bill-1" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/leads/lead-1/bill");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("bill").name).toBe("electricity.pdf");
  });

  it("starts OCR only after the upload action is complete", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: { analysis: { ocrStatus: "completed", verificationStatus: "needs_review" } },
    });

    await expect(analyzeHomeownerBill("lead-1")).resolves.toMatchObject({
      ocrStatus: "completed",
      verificationStatus: "needs_review",
    });
    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1/bill/analyze", { method: "POST" });
  });

  it("maps project milestones and history from the API DTO", () => {
    const project = mapProject({
      id: "project-1",
      currentStage: "site_survey",
      projectStatus: "active",
      customer: { customerName: "Asha Patil", propertyAddress: "Pune" },
      quotation: { systemCapacityKW: 3, estimatedAnnualGeneration: 4200 },
      milestones: [{ id: "milestone-1", stage: "site_survey", status: "in_progress", note: "Survey pending" }],
      history: [{ id: "event-1", eventType: "project_created", createdAt: "2026-11-09T10:00:00.000Z" }],
    });

    expect(project).toMatchObject({
      id: "project-1",
      systemSizeKw: 3,
      annualGenerationUnits: 4200,
      milestones: [{ label: "Site Survey", status: "in-progress" }],
      updates: [{ title: "Project Created" }],
    });
  });

  it("maps real quotation amounts and rule verification without fabricating prices", () => {
    const quotation = mapQuotation({
      id: "quote-1",
      quotationNumber: "SQ-2026-001",
      quotationStatus: "generated",
      systemCapacityKW: 3,
      estimatedAnnualGeneration: 4200,
      equipmentCost: null,
      installationCharges: null,
      totalInstallationCost: 100000,
      applicableSubsidy: 0,
      netInstallationCost: 100000,
      subsidySnapshot: { verificationStatus: "unverified" },
    });

    expect(quotation).toMatchObject({
      id: "quote-1",
      quotationNumber: "SQ-2026-001",
      systemSizeKw: 3,
      equipmentCost: null,
      subsidyLabel: "Subsidy rule is not verified",
    });
  });
});
