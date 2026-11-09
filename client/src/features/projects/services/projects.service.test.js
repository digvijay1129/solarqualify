import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/api/api-client.js", () => ({
  API_BASE_URL: "http://127.0.0.1:5000/api/v1",
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../../../services/api/api-client.js";
import {
  getProjectById,
  getProjectNotificationHistory,
  getProjectTrackerData,
  getPublicCustomerProjectStatus,
  issueCustomerTrackingLink,
  mapProjectRecord,
  revokeCustomerTrackingLink,
  updateProjectLifecycle,
} from "./projects.service.js";

describe("Project API integration service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps actual project, milestone and history DTOs without demo assumptions", () => {
    const project = mapProjectRecord({
      id: "project-1",
      quotationId: "quote-1",
      customer: { customerName: "Asha Patil", propertyAddress: "Pune, Maharashtra" },
      quotation: { systemCapacityKW: 3, estimatedAnnualGeneration: 4200, quotationNumber: "SQ-TEST001" },
      currentStage: "system_design",
      projectStatus: "active",
      milestones: [
        { id: "m1", stage: "site_survey", status: "completed", completedAt: "2026-11-01T00:00:00.000Z" },
        { id: "m2", stage: "system_design", status: "in_progress" },
        { id: "m3", stage: "customer_approval", status: "pending" },
      ],
      history: [{ id: "h1", eventType: "milestone_updated", note: "Design started", createdAt: "2026-11-02T00:00:00.000Z" }],
    });

    expect(project).toMatchObject({
      id: "project-1",
      customerName: "Asha Patil",
      address: "Pune, Maharashtra",
      location: "Pune, Maharashtra",
      systemSizeKw: 3,
      annualGenerationUnits: 4200,
      quotationReference: "SQ-TEST001",
      currentStageId: "system_design",
      currentStageLabel: "System Design",
      status: "active",
      progressPercent: 50,
      notes: [{ id: "h1", text: "Design started" }],
    });
  });

  it("loads a scoped server project page with status and stage filters", async () => {
    apiRequest.mockResolvedValue({
      success: true,
      data: { projects: [], pagination: { page: 2, pageSize: 20, totalItems: 21, totalPages: 2 } },
    });

    const result = await getProjectTrackerData({ page: 2, pageSize: 20, status: "active", stage: "inspection" });

    expect(result.dataMode).toBe("live");
    expect(result.pagination).toMatchObject({ page: 2, totalItems: 21 });
    const url = new URL(apiRequest.mock.calls[0][0], "http://localhost");
    expect(url.pathname).toBe("/projects");
    expect(Object.fromEntries(url.searchParams.entries())).toEqual({
      page: "2", pageSize: "20", status: "active", stage: "inspection",
    });
  });

  it("retrieves an authorized project detail", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { project: { id: "project-1", customer: { customerName: "Asha" }, quotation: {}, currentStage: "site_survey", milestones: [], history: [] } } });
    await expect(getProjectById("project-1")).resolves.toMatchObject({ id: "project-1", customerName: "Asha" });
    expect(apiRequest).toHaveBeenCalledWith("/projects/project-1");
  });

  it("persists a valid milestone transition", async () => {
    const project = { id: "project-1", customer: { customerName: "Asha" }, quotation: {}, currentStage: "site_survey", milestones: [], history: [] };
    apiRequest.mockResolvedValue({ success: true, data: { project } });
    await updateProjectLifecycle("project-1", { stage: "site_survey", milestoneStatus: "completed", note: "Survey complete" });
    expect(apiRequest).toHaveBeenCalledWith("/projects/project-1/status", {
      method: "PATCH",
      body: { stage: "site_survey", milestoneStatus: "completed", note: "Survey complete" },
    });
  });

  it("loads persisted in-app notification history", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { notifications: [{ id: "n1", deliveryStatus: "simulated" }] } });
    await expect(getProjectNotificationHistory("project-1")).resolves.toEqual([{ id: "n1", deliveryStatus: "simulated" }]);
    expect(apiRequest).toHaveBeenCalledWith("/projects/project-1/notifications?page=1&pageSize=20");
  });

  it("creates a public customer tracking link from the one-time token response", async () => {
    vi.stubGlobal("location", { origin: "http://127.0.0.1:3000" });
    apiRequest.mockResolvedValue({ success: true, data: { token: "abc", path: "/api/v1/public/project-status/abc", expiresAt: "2027-01-01T00:00:00.000Z" } });
    await expect(issueCustomerTrackingLink("project-1")).resolves.toMatchObject({
      url: "http://127.0.0.1:3000/project-status/abc",
      token: "abc",
    });
    expect(apiRequest).toHaveBeenCalledWith("/projects/project-1/public-status-token", { method: "POST" });
  });

  it("loads a customer-facing tracking status without an authenticated token", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { projectReference: "SQP-123", currentStage: "site_survey" } });
    await expect(getPublicCustomerProjectStatus("public-token")).resolves.toMatchObject({ projectReference: "SQP-123" });
    expect(apiRequest).toHaveBeenCalledWith("/public/project-status/public-token", { auth: false });
  });

  it("revokes an existing customer tracking link", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { revoked: true } });
    await revokeCustomerTrackingLink("project-1");
    expect(apiRequest).toHaveBeenCalledWith("/projects/project-1/public-status-token", { method: "DELETE" });
  });
});
