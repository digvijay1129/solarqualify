import { apiRequest } from "../../../services/api/api-client.js";
import { getLeads } from "../../leads/services/leads.service.js";

const MONTH_OPTIONS = new Set([6, 12, 24]);

function unwrap(response) {
  return response?.data ?? response;
}

export function getDashboardDateRange(months = 12, today = new Date()) {
  const monthCount = Number(months);
  if (!MONTH_OPTIONS.has(monthCount)) {
    throw new Error("Dashboard period must be 6, 12 or 24 months.");
  }

  const end = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  ));
  const start = new Date(Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth() - monthCount + 1,
    1
  ));

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function formatMonth(monthKey) {
  const date = new Date(`${monthKey}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return monthKey;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatPeriod(dateRange = {}) {
  const format = (value) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat("en-IN", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(date);
  };
  const start = format(dateRange.startDate);
  const end = format(dateRange.endDate);
  return start && end ? `${start} – ${end}` : "Selected reporting period";
}

function titleCase(value) {
  return String(value ?? "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mapDashboardAnalytics(analytics, recentLeads = []) {
  if (!analytics || analytics.dataMode !== "live") {
    throw new Error("The analytics API did not return a live analytics result.");
  }

  const leads = analytics.leads ?? {};
  const quotations = analytics.quotations ?? {};
  const projects = analytics.projects ?? {};
  const financials = analytics.financials ?? {};
  const monthlyLeadTrend = (leads.monthlyTrend ?? []).map((item) => ({
    month: formatMonth(item.month),
    monthKey: item.month,
    leads: Number(item.totalLeads) || 0,
    qualifiedLeads: Number(item.qualifiedLeads) || 0,
    convertedLeads: Number(item.convertedLeads) || 0,
  }));
  const priorityCounts = new Map(
    (leads.priorityDistribution ?? []).map((item) => [
      String(item.key).toLowerCase(),
      Number(item.count) || 0,
    ])
  );

  const kpis = [
    {
      id: "total-leads",
      label: "Total Leads",
      value: Number(leads.totalLeads) || 0,
      icon: "users",
      theme: "green",
      growth: null,
      sparkline: monthlyLeadTrend.map((item) => item.leads),
    },
    {
      id: "high-priority",
      label: "High Priority",
      value: priorityCounts.get("high") ?? 0,
      icon: "target",
      theme: "pink",
      growth: null,
      sparkline: [],
    },
    {
      id: "quotes-generated",
      label: "Quotations Generated",
      value: Number(quotations.generatedQuotations) || 0,
      icon: "file-text",
      theme: "yellow",
      growth: null,
      sparkline: [],
    },
    {
      id: "active-projects",
      label: "Active Projects",
      value: Number(projects.activeProjects) || 0,
      icon: "house",
      theme: "purple",
      growth: null,
      sparkline: [],
    },
  ];

  return {
    dataMode: "live",
    dataLabel: "Live role-scoped analytics from the SolarQualify API.",
    scope: analytics.scope,
    dateRange: analytics.dateRange ?? null,
    periodLabel: formatPeriod(analytics.dateRange),
    kpis,
    monthlyLeadTrend,
    priorityDistribution: ["high", "medium", "low"].map((key) => ({
      name: titleCase(key),
      value: priorityCounts.get(key) ?? 0,
    })),
    summary: {
      leads: {
        total: Number(leads.totalLeads) || 0,
        qualified: Number(leads.qualifiedLeads) || 0,
        converted: Number(leads.convertedLeads) || 0,
        qualificationRate: Number(leads.qualificationRate) || 0,
        conversionRate: Number(leads.conversionRate) || 0,
      },
      quotations: {
        generated: Number(quotations.generatedQuotations) || 0,
        sent: Number(quotations.sentQuotations) || 0,
        accepted: Number(quotations.acceptedQuotations) || 0,
        rejected: Number(quotations.rejectedQuotations) || 0,
        expired: Number(quotations.expiredQuotations) || 0,
        acceptanceRate: Number(quotations.acceptanceRate) || 0,
      },
      projects: {
        total: Number(projects.totalProjects) || 0,
        active: Number(projects.activeProjects) || 0,
        onHold: Number(projects.onHoldProjects) || 0,
        completed: Number(projects.completedProjects) || 0,
        cancelled: Number(projects.cancelledProjects) || 0,
      },
      financials: {
        currency: financials.currency ?? "INR",
        generatedQuotationValueEstimate: Number(financials.generatedQuotationValueEstimate) || 0,
        acceptedQuotationValueEstimate: Number(financials.acceptedQuotationValueEstimate) || 0,
        realizedRevenue: financials.realizedRevenue ?? null,
        realizedRevenueStatus: financials.realizedRevenueStatus ?? "not_tracked",
        explanation: financials.explanation ?? "",
      },
    },
    recentLeads: recentLeads.map((lead) => ({
      ...lead,
      name: lead.name || "Unnamed customer",
      monthlyBill: lead.monthlyBill ?? null,
      monthlyUnits: lead.monthlyUnits ?? null,
      displaySystemLabel: lead.recommendedSystemKw == null
        ? "Pending"
        : `${lead.recommendedSystemKw} kW`,
    })),
    reportingNotes: analytics.reportingNotes ?? [],
  };
}

export async function getDashboardOverview({ months = 12 } = {}) {
  const dateRange = getDashboardDateRange(months);
  const params = new URLSearchParams(dateRange);
  const [analyticsResponse, leadsResponse] = await Promise.all([
    apiRequest(`/analytics/dashboard?${params.toString()}`),
    getLeads({ page: 1, pageSize: 5, status: "all" }),
  ]);

  const analytics = unwrap(analyticsResponse)?.analytics;
  const leads = unwrap(leadsResponse)?.items ?? [];
  return mapDashboardAnalytics(analytics, leads);
}
