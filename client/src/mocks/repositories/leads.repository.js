import { leadsOverviewFixture } from "../fixtures/leads.fixture.js";

/**
 * Local demo repository for Lead Management.
 *
 * Filters and pagination operate on the available demo records.
 * Summary metrics remain illustrative fixture values.
 *
 * Replace this implementation with an API-backed repository
 * during backend integration.
 */

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-");
}

function matchesSearch(lead, search) {
  if (!search) {
    return true;
  }

  const searchableValues = [
    lead.name,
    lead.referenceId,
    lead.id,
    lead.phone,
    lead.email,
    lead.location,
  ];

  return searchableValues.some((value) =>
    String(value ?? "").toLowerCase().includes(search)
  );
}

export const leadsRepository = {
  async getOverview() {
    return structuredClone(leadsOverviewFixture);
  },

  async getLeads({
    status = "all",
    priority = "all",
    location = "all",
    search = "",
    page = 1,
    pageSize = 5,
  } = {}) {
    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const safePageSize = Math.max(
      1,
      Math.floor(Number(pageSize) || 5)
    );

    const normalizedStatus = normalize(status);
    const normalizedPriority = normalize(priority);
    const normalizedLocation = normalize(location);
    const normalizedSearch = String(search).trim().toLowerCase();

    let records = structuredClone(leadsOverviewFixture.leads);

    if (normalizedStatus !== "all") {
      records = records.filter(
        (lead) => normalize(lead.status) === normalizedStatus
      );
    }

    if (normalizedPriority !== "all") {
      records = records.filter(
        (lead) => normalize(lead.priority) === normalizedPriority
      );
    }

    if (normalizedLocation === "not-provided") {
      records = records.filter(
        (lead) => !String(lead.location ?? "").trim()
      );
    } else if (normalizedLocation !== "all") {
      records = records.filter(
        (lead) => normalize(lead.location) === normalizedLocation
      );
    }

    records = records.filter((lead) =>
      matchesSearch(lead, normalizedSearch)
    );

    const totalItems = records.length;
    const totalPages = Math.ceil(totalItems / safePageSize);

    const startIndex = (safePage - 1) * safePageSize;

    return {
      items: records.slice(startIndex, startIndex + safePageSize),
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        totalItems,
        totalPages,
      },
    };
  },

  async getLeadById(leadId) {
    const lead = leadsOverviewFixture.leads.find(
      (item) => item.id === leadId
    );

    return lead ? structuredClone(lead) : null;
  },
};