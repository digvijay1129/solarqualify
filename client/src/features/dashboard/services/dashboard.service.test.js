import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/api/api-client.js", () => ({
  apiRequest: vi.fn(),
}));
vi.mock("../../leads/services/leads.service.js", () => ({
  getLeads: vi.fn(),
}));

import { apiRequest } from "../../../services/api/api-client.js";
import { getLeads } from "../../leads/services/leads.service.js";
import {
  getDashboardDateRange,
  getDashboardOverview,
  mapDashboardAnalytics,
} from "./dashboard.service.js";

const analytics = {
  dataMode: "live",
  scope: "sales_staff",
  dateRange: {
    startDate: "2026-06-01",
    endDate: "2026-11-09",
    timestampField: "createdAt",
    timezone: "UTC",
    monthCount: 6,
  },
  leads: {
    totalLeads: 16,
    qualifiedLeads: 8,
    convertedLeads: 3,
    qualificationRate: 50,
    conversionRate: 18.75,
    priorityDistribution: [
      { key: "low", count: 5 },
      { key: "medium", count: 7 },
      { key: "high", count: 4 },
    ],
    monthlyTrend: [
      { month: "2026-06", totalLeads: 1, qualifiedLeads: 0, convertedLeads: 0 },
      { month: "2026-07", totalLeads: 2, qualifiedLeads: 1, convertedLeads: 0 },
      { month: "2026-08", totalLeads: 3, qualifiedLeads: 2, convertedLeads: 1 },
      { month: "2026-09", totalLeads: 4, qualifiedLeads: 2, convertedLeads: 1 },
      { month: "2026-10", totalLeads: 3, qualifiedLeads: 2, convertedLeads: 0 },
      { month: "2026-11", totalLeads: 3, qualifiedLeads: 1, convertedLeads: 1 },
    ],
  },
  quotations: {
    generatedQuotations: 5,
    sentQuotations: 4,
    acceptedQuotations: 2,
    rejectedQuotations: 1,
    expiredQuotations: 0,
    acceptanceRate: 40,
  },
  projects: {
    totalProjects: 4,
    activeProjects: 2,
    onHoldProjects: 1,
    completedProjects: 1,
    cancelledProjects: 0,
  },
  financials: {
    currency: "INR",
    generatedQuotationValueEstimate: 650000,
    acceptedQuotationValueEstimate: 280000,
    realizedRevenue: null,
    realizedRevenueStatus: "not_tracked",
    explanation: "Invoices and payments are not stored.",
  },
  reportingNotes: ["Current lead states are not historical status events."],
};

describe("Dashboard analytics API integration", () => {
  beforeEach(() => vi.clearAllMocks());

  it("builds UTC date ranges for supported reporting periods", () => {
    expect(getDashboardDateRange(6, new Date("2026-11-09T12:00:00.000Z"))).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-11-09",
    });
    expect(getDashboardDateRange(12, new Date("2026-11-09T12:00:00.000Z")).startDate).toBe("2025-12-01");
    expect(() => getDashboardDateRange(9)).toThrow("6, 12 or 24 months");
  });

  it("maps live analytics into dashboard KPIs, charts, summaries and recent API leads", () => {
    const recentLeads = [{
      id: "lead-1",
      referenceId: "SQL-0001",
      name: "Asha Patil",
      monthlyBill: null,
      monthlyUnits: 240,
      priority: "High",
      status: "Qualified",
      recommendedSystemKw: 2,
    }];
    const result = mapDashboardAnalytics(analytics, recentLeads);

    expect(result.dataMode).toBe("live");
    expect(result.scope).toBe("sales_staff");
    expect(result.kpis.map((item) => item.value)).toEqual([16, 4, 5, 2]);
    expect(result.monthlyLeadTrend[0]).toMatchObject({
      monthKey: "2026-06",
      leads: 1,
      qualifiedLeads: 0,
      convertedLeads: 0,
    });
    expect(result.priorityDistribution).toEqual([
      { name: "High", value: 4 },
      { name: "Medium", value: 7 },
      { name: "Low", value: 5 },
    ]);
    expect(result.summary.leads.qualificationRate).toBe(50);
    expect(result.summary.quotations.acceptanceRate).toBe(40);
    expect(result.summary.projects.onHold).toBe(1);
    expect(result.summary.financials.realizedRevenue).toBeNull();
    expect(result.recentLeads[0]).toMatchObject({
      displaySystemLabel: "2 kW",
      monthlyBill: null,
    });
  });

  it("loads the analytics endpoint and latest leads concurrently for the selected period", async () => {
    apiRequest.mockResolvedValue({ success: true, data: { analytics } });
    getLeads.mockResolvedValue({
      items: [{ id: "lead-1", name: "Asha Patil" }],
      pagination: { page: 1, pageSize: 5, totalItems: 1, totalPages: 1 },
    });

    const result = await getDashboardOverview({ months: 6 });

    expect(result.dataMode).toBe("live");
    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toMatch(/^\/analytics\/dashboard\?/);
    const url = new URL(path, "http://localhost");
    expect(Object.fromEntries(url.searchParams.entries())).toEqual({
      startDate: expect.any(String),
      endDate: expect.any(String),
    });
    expect(options).toBeUndefined();
    expect(getLeads).toHaveBeenCalledWith({ page: 1, pageSize: 5, status: "all" });
  });

  it("rejects demo or missing analytics instead of silently showing fixture values", () => {
    expect(() => mapDashboardAnalytics({ dataMode: "demo" })).toThrow("live analytics");
    expect(() => mapDashboardAnalytics(null)).toThrow("live analytics");
  });

  it("keeps absent priority categories and summary counts at zero", () => {
    const empty = mapDashboardAnalytics({
      dataMode: "live",
      leads: { priorityDistribution: [], monthlyTrend: [] },
      quotations: {},
      projects: {},
      financials: {},
    });
    expect(empty.kpis.map((item) => item.value)).toEqual([0, 0, 0, 0]);
    expect(empty.priorityDistribution).toEqual([
      { name: "High", value: 0 },
      { name: "Medium", value: 0 },
      { name: "Low", value: 0 },
    ]);
  });
});
