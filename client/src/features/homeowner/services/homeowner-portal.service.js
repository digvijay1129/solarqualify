import { apiRequest } from "../../../services/api/api-client.js";

function unwrap(response) {
  return response?.data ?? response;
}

function formatStage(stage) {
  return String(stage ?? "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapMilestone(milestone, index) {
  const date = milestone.completedAt ?? milestone.updatedAt ?? milestone.createdAt ?? null;
  return {
    id: milestone.id || milestone.stage || String(index),
    label: formatStage(milestone.stage),
    date: date ? new Date(date).toISOString().slice(0, 10) : null,
    status: milestone.status === "in_progress"
      ? "in-progress"
      : milestone.status === "completed" || milestone.status === "skipped"
        ? "completed"
        : "upcoming",
    description: milestone.note || (
      milestone.status === "completed"
        ? "This milestone is marked complete."
        : milestone.status === "in_progress"
          ? "This is the current project milestone."
          : "This milestone is pending."
    ),
  };
}

export function mapProject(project) {
  const quotation = project.quotation ?? {};
  const customer = project.customer ?? {};
  const history = project.history ?? [];
  const milestones = (project.milestones ?? []).map(mapMilestone);

  return {
    id: project.id,
    title: "Rooftop Solar Installation",
    location: customer.propertyAddress || "Address not available",
    systemSizeKw: quotation.systemCapacityKW ?? 0,
    annualGenerationUnits: quotation.estimatedAnnualGeneration ?? null,
    stage: formatStage(project.currentStage),
    status: project.projectStatus,
    statusLabel: formatStage(project.projectStatus),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    leadId: project.leadId,
    quotationId: project.quotationId,
    milestones,
    history,
    updates: history
      .slice()
      .reverse()
      .map((event) => ({
        id: event.id,
        title: formatStage(event.eventType),
        description: event.note || (
          event.toStage
            ? `Project stage updated to ${formatStage(event.toStage)}.`
            : "Project record updated."
        ),
        date: event.createdAt,
      })),
    customer,
    quotation,
  };
}

export function mapQuotation(quotation) {
  const status = String(quotation.quotationStatus ?? "generated");
  const subsidyVerified = quotation.subsidySnapshot?.verificationStatus === "verified";

  return {
    id: quotation.id,
    leadId: quotation.leadId,
    title: quotation.quotationNumber || "Solar Quotation",
    quotationNumber: quotation.quotationNumber,
    systemSizeKw: quotation.systemCapacityKW,
    annualGenerationUnits: quotation.estimatedAnnualGeneration,
    status: status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    statusCode: status,
    createdAt: quotation.generatedAt ?? quotation.createdAt,
    validUntil: null,
    equipmentCost: quotation.equipmentCost,
    installationCost: quotation.installationCharges,
    totalInstallationCost: quotation.totalInstallationCost,
    subsidyAmount: quotation.applicableSubsidy,
    subsidyLabel: subsidyVerified ? "Rule marked verified" : "Subsidy rule is not verified",
    netInstallationCost: quotation.netInstallationCost,
    notes: (quotation.calculationReasons ?? [])
      .map((reason) => reason.detail)
      .filter(Boolean)
      .join(" "),
    calculationReasons: quotation.calculationReasons ?? [],
    calculationVersion: quotation.calculationVersion,
    pricingSnapshot: quotation.pricingSnapshot,
    subsidySnapshot: quotation.subsidySnapshot,
    generationSnapshot: quotation.generationSnapshot,
  };
}

async function getLeadBill(lead) {
  try {
    const result = unwrap(await apiRequest(`/leads/${lead.id}/bill`));
    return result?.bill ?? null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

async function getLeadQuotations(lead) {
  const result = unwrap(await apiRequest(`/leads/${lead.id}/quotations?limit=50`));
  return (result?.quotations ?? []).map(mapQuotation);
}

export async function getHomeownerPortalSession(user) {
  const [overviewResponse, leadsResponse, projectsResponse] = await Promise.all([
    apiRequest("/leads/overview"),
    apiRequest("/leads?page=1&pageSize=20&status=all"),
    apiRequest("/projects?page=1&pageSize=100"),
  ]);

  const overview = unwrap(overviewResponse);
  const leadsResult = unwrap(leadsResponse);
  const projectsResult = unwrap(projectsResponse);
  const leads = leadsResult?.items ?? [];
  const projects = (projectsResult?.projects ?? []).map(mapProject);

  const [quotationGroups, billResults] = await Promise.all([
    Promise.all(leads.map((lead) => getLeadQuotations(lead))),
    Promise.all(leads.map((lead) => getLeadBill(lead))),
  ]);

  const quotations = quotationGroups.flat().sort(
    (left, right) => new Date(right.createdAt ?? 0) - new Date(left.createdAt ?? 0)
  );

  const documents = [
    ...billResults.filter(Boolean).map((bill) => ({
      id: bill.id,
      leadId: bill.leadId,
      name: bill.originalFileName,
      category: "Bills",
      status: bill.verificationStatus === "verified" ? "Verified" : "Awaiting review",
      uploadedAt: bill.createdAt ? new Date(bill.createdAt).toISOString().slice(0, 10) : "",
      sizeLabel: `${Math.round((bill.documentSize ?? 0) / 1024)} KB`,
      fileAttached: true,
      description: "Private electricity bill stored by the SolarQualify API.",
    })),
    ...quotations.map((quotation) => ({
      id: `quotation-${quotation.id}`,
      quotationId: quotation.id,
      name: `${quotation.quotationNumber || "Solar quotation"}.pdf`,
      category: "Quotations",
      status: quotation.status,
      uploadedAt: quotation.createdAt ? new Date(quotation.createdAt).toISOString().slice(0, 10) : "",
      sizeLabel: "PDF generated on download",
      fileAttached: true,
      description: "Downloadable quotation PDF.",
    })),
  ];

  const latestProject = projects[0] ?? null;
  const activityItems = [
    ...leads.map((lead) => ({
      id: `lead-${lead.id}`,
      title: "Solar enquiry submitted",
      description: `Lead reference ${lead.referenceId} · ${lead.status}`,
      date: lead.createdAt,
    })),
    ...projects.flatMap((project) => project.updates),
  ].filter((item) => item.date).sort(
    (left, right) => new Date(right.date) - new Date(left.date)
  ).slice(0, 8);

  const profile = {
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    mobileNumber: String(user?.phone ?? "").replace(/^\+91\s*/, ""),
    city: "",
    state: "",
    addressLine1: "",
    pincode: "",
    propertyType: "",
    ownershipStatus: "",
    roofType: "",
    roofAreaSqFt: "",
    monthlyElectricityBill: "",
    monthlyUnits: "",
  };

  return {
    dataMode: "live",
    dataLabel: "Live records retrieved from your authenticated SolarQualify account.",
    dataNote: overview?.dataNote ?? "",
    profile,
    summary: overview?.summary ?? {},
    project: latestProject,
    projects,
    quotations,
    documents,
    activities: activityItems,
    leads,
    leadSubmissions: leads,
    supportRequests: [],
    notificationPreferences: {
      projectUpdates: true,
      quotationUpdates: true,
      subsidyAlerts: true,
      productUpdates: false,
    },
    contactPreferences: { email: true, phone: true, whatsapp: false },
    faqs: [],
    supportTopics: ["Project Update", "Quotation Query", "Bill Upload Help", "Subsidy Guidance", "Document Help", "Other"],
    quoteDecisions: {},
  };
}

export async function createHomeownerLead(payload) {
  const response = unwrap(await apiRequest("/leads", {
    method: "POST",
    body: payload,
  }));
  return response?.lead ?? null;
}

export async function uploadHomeownerBill(leadId, file) {
  const formData = new FormData();
  formData.append("bill", file);

  const response = unwrap(await apiRequest(`/leads/${leadId}/bill`, {
    method: "POST",
    body: formData,
  }));
  return response?.bill ?? null;
}

export async function analyzeHomeownerBill(leadId) {
  const response = unwrap(await apiRequest(`/leads/${leadId}/bill/analyze`, {
    method: "POST",
  }));
  return response?.analysis ?? null;
}

export async function retryHomeownerBillAnalysis(leadId) {
  return analyzeHomeownerBill(leadId);
}

export async function downloadHomeownerBill(leadId) {
  return apiRequest(`/leads/${leadId}/bill/download`, {
    responseType: "blob",
  });
}

export async function deleteHomeownerBill(leadId) {
  return apiRequest(`/leads/${leadId}/bill`, { method: "DELETE" });
}


export async function decideHomeownerQuotation(quotationId, decision) {
  if (!quotationId) throw new Error("A quotation ID is required.");
  if (!["accepted", "rejected"].includes(decision)) {
    throw new Error("Decision must be accepted or rejected.");
  }
  const response = unwrap(await apiRequest(`/quotations/${quotationId}/decision`, {
    method: "PATCH",
    body: { decision },
  }));
  return response?.quotation ?? null;
}
