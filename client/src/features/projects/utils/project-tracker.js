import { projectStages } from "../../../mocks/fixtures/project-tracker.fixture.js";

export function calculateAnnualGeneration(capacityKw, unitsPerKwPerYear = 1400) {
  const capacity = Number(capacityKw);
  const rate = Number(unitsPerKwPerYear);
  if (!Number.isFinite(capacity) || capacity < 0) return 0;
  if (!Number.isFinite(rate) || rate < 0) return 0;
  return Math.round(capacity * rate);
}

export function calculatePortfolioAnnualGeneration(totalCapacityKw, unitsPerKwPerYear = 1400) {
  return calculateAnnualGeneration(totalCapacityKw, unitsPerKwPerYear);
}

export function sumStageCounts(stageCounts = []) {
  return stageCounts.reduce((total, stage) => {
    const count = Number(stage.count);
    return total + (Number.isFinite(count) && count > 0 ? count : 0);
  }, 0);
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isOverdue(project, asOfDate) {
  if (!project?.dueDate || !asOfDate) return false;
  if (project.status === "completed" || project.currentStageId === "subsidy-credited") return false;
  return project.dueDate < asOfDate;
}

function isWithinNextDays(dateValue, referenceDate, dayCount) {
  if (!dateValue || !referenceDate) return false;
  const due = new Date(`${dateValue}T00:00:00Z`);
  const base = new Date(`${referenceDate}T00:00:00Z`);
  if (Number.isNaN(due.getTime()) || Number.isNaN(base.getTime())) return false;
  const difference = Math.round((due.getTime() - base.getTime()) / 86_400_000);
  return difference >= 0 && difference <= dayCount;
}

export function filterProjects(projects = [], filters = {}, context = {}) {
  const {
    view = "all",
    query = "",
    location = "all",
    stage = "all",
    dateRange = "all",
  } = filters;
  const referenceDate = context.referenceDate ?? "2026-11-08";
  const currentStaffId = context.currentStaffId ?? "digvijay-rajput";
  const search = normalize(query);

  return projects.filter((project) => {
    if (view === "my" && project.assignedToId !== currentStaffId) return false;
    if (view === "overdue" && !isOverdue(project, referenceDate)) return false;

    if (location !== "all" && normalize(project.location) !== normalize(location)) return false;
    if (stage !== "all" && project.currentStageId !== stage) return false;

    if (dateRange === "this-month") {
      if (!project.dueDate || project.dueDate.slice(0, 7) !== referenceDate.slice(0, 7)) return false;
    } else if (dateRange === "next-30-days") {
      if (!isWithinNextDays(project.dueDate, referenceDate, 30)) return false;
    } else if (dateRange === "overdue") {
      if (!isOverdue(project, referenceDate)) return false;
    }

    if (search) {
      const haystack = [
        project.id,
        project.customerName,
        project.location,
        project.address,
        project.quotationReference,
        project.currentStageId,
      ].map(normalize).join(" ");
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export function paginateProjects(projects = [], page = 1, pageSize = 5) {
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 5;
  const totalItems = projects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const startIndex = (currentPage - 1) * safePageSize;
  const items = projects.slice(startIndex, startIndex + safePageSize);

  return {
    items,
    currentPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: Math.min(startIndex + items.length, totalItems),
  };
}

export function getProjectStageState(project, stageId) {
  const currentIndex = projectStages.findIndex((stage) => stage.id === project?.currentStageId);
  const targetIndex = projectStages.findIndex((stage) => stage.id === stageId);
  if (targetIndex < 0 || currentIndex < 0) return "pending";
  if (targetIndex < currentIndex) return "completed";
  if (targetIndex === currentIndex) return "current";
  return "pending";
}

export function formatProjectDate(dateValue, fallback = "—") {
  if (!dateValue) return fallback;
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function updateProjectStage(project, stageId, eventDate, note = "") {
  if (!project) throw new Error("A project is required to update its stage.");
  const stage = projectStages.find((item) => item.id === stageId);
  if (!stage) throw new Error("Select a valid project stage.");
  if (!eventDate || Number.isNaN(new Date(`${eventDate}T00:00:00`).getTime())) {
    throw new Error("Enter a valid stage date.");
  }

  const existingTimeline = Array.isArray(project.timeline) ? project.timeline : [];
  const timelineWithoutTarget = existingTimeline.filter((item) => item.stageId !== stageId);
  const timeline = [...timelineWithoutTarget, { stageId, date: eventDate }].sort((a, b) => {
    const indexA = projectStages.findIndex((item) => item.id === a.stageId);
    const indexB = projectStages.findIndex((item) => item.id === b.stageId);
    return indexA - indexB;
  });

  const notes = [...(project.notes ?? [])];
  if (String(note).trim()) {
    notes.unshift({
      id: `session-note-${Date.now()}`,
      text: String(note).trim(),
      author: "Current Sales Staff",
      date: eventDate,
      sessionOnly: true,
    });
  }

  return {
    ...project,
    currentStageId: stage.id,
    currentStageLabel: stage.label,
    progressPercent: stage.defaultProgress,
    timeline,
    notes,
    lastUpdatedDate: eventDate,
    status: stage.id === "subsidy-credited" ? "completed" : (project.status === "on-hold" || project.status === "completed") ? "in-progress" : project.status,
  };
}

export function addProjectNote(project, text, author = "Current Sales Staff", date = "2026-11-08") {
  if (!project) throw new Error("A project is required to add a note.");
  const trimmed = String(text ?? "").trim();
  if (!trimmed) throw new Error("Enter a note before adding it.");
  return {
    ...project,
    notes: [
      {
        id: `session-note-${Date.now()}`,
        text: trimmed,
        author,
        date,
        sessionOnly: true,
      },
      ...(project.notes ?? []),
    ],
  };
}

export function addLocalDocument(project, file, date = "2026-11-08") {
  if (!project) throw new Error("A project is required to attach a document.");
  if (!file) throw new Error("Choose a document first.");
  const extension = String(file.name ?? "").split(".").pop().toLowerCase();
  const accepted = ["pdf", "jpg", "jpeg", "png"];
  if (!accepted.includes(extension)) throw new Error("Only PDF, JPG and PNG files are supported in this demo.");
  if (file.size > 10 * 1024 * 1024) throw new Error("The selected file exceeds the 10 MB demo limit.");
  if (file.size === 0) throw new Error("The selected file is empty.");

  return {
    ...project,
    documents: [
      {
        id: `session-doc-${Date.now()}`,
        name: file.name,
        category: "Session upload",
        status: "Local session only",
        date,
        sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        sessionOnly: true,
      },
      ...(project.documents ?? []),
    ],
  };
}
