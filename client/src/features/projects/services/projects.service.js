import { apiRequest } from "../../../services/api/api-client.js";

function unwrap(response) {
  return response?.data ?? response;
}

export const PROJECT_STAGES = [
  { id: "site_survey", label: "Site Survey" },
  { id: "system_design", label: "System Design" },
  { id: "customer_approval", label: "Customer Approval" },
  { id: "installation_scheduled", label: "Installation Scheduled" },
  { id: "installation_in_progress", label: "Installation In Progress" },
  { id: "inspection", label: "Inspection" },
  { id: "net_metering", label: "Net Metering" },
  { id: "completed", label: "Completed" },
];

export const PROJECT_STATUSES = [
  { id: "active", label: "Active" },
  { id: "on_hold", label: "On Hold" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const stageLabels = new Map(PROJECT_STAGES.map((stage) => [stage.id, stage.label]));

function humanize(value) {
  return String(value ?? "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mapProjectRecord(project) {
  const milestones = (project.milestones ?? []).map((item) => ({
    ...item,
    stageLabel: stageLabels.get(item.stage) ?? humanize(item.stage),
  }));
  const completedCount = milestones.filter((item) => ["completed", "skipped"].includes(item.status)).length;
  const inProgressCount = milestones.filter((item) => item.status === "in_progress").length;
  const progressPercent = Math.round(((completedCount + inProgressCount * 0.5) / Math.max(milestones.length, 1)) * 100);
  const address = project.customer?.propertyAddress ?? "Address not provided";
  const locationParts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    ...project,
    customerName: project.customer?.customerName ?? "Homeowner",
    email: project.customer?.email ?? null,
    phone: project.customer?.phone ?? null,
    address,
    location: locationParts.length > 1 ? locationParts.slice(-2).join(", ") : (locationParts[0] ?? "Location not provided"),
    systemSizeKw: project.quotation?.systemCapacityKW ?? null,
    annualGenerationUnits: project.quotation?.estimatedAnnualGeneration ?? null,
    quotationReference: project.quotation?.quotationNumber ?? project.quotationId,
    currentStageId: project.currentStage,
    currentStageLabel: stageLabels.get(project.currentStage) ?? humanize(project.currentStage),
    progressPercent,
    status: project.projectStatus,
    statusLabel: humanize(project.projectStatus),
    milestones,
    timeline: milestones,
    notes: (project.history ?? []).map((event) => ({
      id: event.id,
      title: humanize(event.eventType),
      text: event.note || humanize(event.eventType),
      author: event.performedBy ?? "System",
      date: event.createdAt,
      createdAt: event.createdAt,
    })),
    documents: [],
    dueDate: null,
    assignedToName: "Assigned Sales Staff",
  };
}

export async function getProjectTrackerData(filters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 20),
    status: filters.status ?? "all",
    stage: filters.stage ?? "all",
  });
  const result = unwrap(await apiRequest(`/projects?${params.toString()}`));
  return {
    dataMode: "live",
    dataLabel: "Live projects scoped to the authenticated account.",
    projects: (result?.projects ?? []).map(mapProjectRecord),
    pagination: result?.pagination ?? { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
  };
}

export async function getProjectById(projectId) {
  if (!projectId) throw new Error("A project ID is required.");
  const result = unwrap(await apiRequest(`/projects/${projectId}`));
  return result?.project ? mapProjectRecord(result.project) : null;
}

export async function updateProjectLifecycle(projectId, payload) {
  if (!projectId) throw new Error("A project ID is required.");
  const result = unwrap(await apiRequest(`/projects/${projectId}/status`, {
    method: "PATCH",
    body: payload,
  }));
  return result?.project ? mapProjectRecord(result.project) : null;
}

export async function getProjectNotificationHistory(projectId, page = 1, pageSize = 20) {
  if (!projectId) throw new Error("A project ID is required.");
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const result = unwrap(await apiRequest(`/projects/${projectId}/notifications?${params.toString()}`));
  return result?.notifications ?? [];
}

export async function issueCustomerTrackingLink(projectId) {
  if (!projectId) throw new Error("A project ID is required.");
  const result = unwrap(await apiRequest(`/projects/${projectId}/public-status-token`, { method: "POST" }));
  if (!result?.path) throw new Error("The API did not return a customer tracking path.");
  const url = new URL(`/project-status/${encodeURIComponent(result.token)}`, globalThis.location.origin).toString();
  return { ...result, url };
}

export async function revokeCustomerTrackingLink(projectId) {
  if (!projectId) throw new Error("A project ID is required.");
  return unwrap(await apiRequest(`/projects/${projectId}/public-status-token`, { method: "DELETE" }));
}

export { humanize as humanizeProjectValue };

export async function getPublicCustomerProjectStatus(token) {
  if (!token) throw new Error("A customer tracking token is required.");
  const result = unwrap(await apiRequest(`/public/project-status/${encodeURIComponent(token)}`, {
    auth: false,
  }));
  return result ?? null;
}


export async function createProjectFromAcceptedQuotation(quotationId) {
  if (!quotationId) throw new Error("A quotation ID is required.");
  const result = unwrap(await apiRequest(`/quotations/${quotationId}/project`, {
    method: "POST",
  }));
  return result?.project ? mapProjectRecord(result.project) : null;
}
