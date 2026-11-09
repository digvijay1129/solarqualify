import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/api/api-client.js", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/api-client.js";
import {
  claimLead,
  getLeadById,
  getLeadQualification,
  getLeads,
  getLeadsOverview,
  qualifyLead,
} from "./leads.service.js";

describe("leads API service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads server-side overview statistics", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { summary: { totalLeads: 14 } } });

    await expect(getLeadsOverview()).resolves.toMatchObject({ summary: { totalLeads: 14 } });
    expect(apiRequest).toHaveBeenCalledWith("/leads/overview");
  });

  it("encodes list filters and pagination in the API request", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { items: [], pagination: { page: 2, pageSize: 10 } } });

    await getLeads({
      page: 2,
      pageSize: 10,
      status: "in-progress",
      priority: "high",
      location: "Pune, Maharashtra",
      search: "Asha Patil",
    });

    const path = apiRequest.mock.calls[0][0];
    const url = new URL(path, "http://localhost");
    expect(url.pathname).toBe("/leads");
    expect(Object.fromEntries(url.searchParams.entries())).toEqual({
      page: "2",
      pageSize: "10",
      status: "in-progress",
      priority: "high",
      location: "Pune, Maharashtra",
      search: "Asha Patil",
    });
  });

  it("retrieves a scoped lead detail", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { lead: { id: "lead-1" } } });

    await expect(getLeadById("lead-1")).resolves.toEqual({ id: "lead-1" });
    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1");
  });

  it("returns null when a lead has not been scored yet", async () => {
    apiRequest.mockRejectedValue({ status: 404, message: "Qualification not found." });

    await expect(getLeadQualification("lead-1")).resolves.toBeNull();
  });

  it("claims an unassigned lead for the signed-in Sales Staff user", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { lead: { id: "lead-1" } } });

    await claimLead("lead-1", "staff-1");

    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1/assignment", {
      method: "PATCH",
      body: { salesStaffId: "staff-1" },
    });
  });

  it("requests a new explainable qualification score", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { qualification: { leadScore: 78, reasons: [] } } });

    await expect(qualifyLead("lead-1")).resolves.toMatchObject({ leadScore: 78 });
    expect(apiRequest).toHaveBeenCalledWith("/leads/lead-1/qualify", { method: "POST" });
  });
});
