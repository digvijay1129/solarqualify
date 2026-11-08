import { describe, expect, it } from "vitest";
import { projectTrackerFixture, projectStages } from "../../../mocks/fixtures/project-tracker.fixture.js";
import {
  calculateAnnualGeneration,
  calculatePortfolioAnnualGeneration,
  sumStageCounts,
  filterProjects,
  paginateProjects,
  getProjectStageState,
  formatProjectDate,
  updateProjectStage,
  addProjectNote,
  addLocalDocument,
} from "./project-tracker.js";

const context = {
  referenceDate: projectTrackerFixture.referenceDate,
  currentStaffId: projectTrackerFixture.currentStaff.id,
};

describe("Project Tracker calculations", () => {
  it("calculates annual generation for a 3 kW project using the 1,400-unit assumption", () => {
    expect(calculateAnnualGeneration(3, 1400)).toBe(4200);
  });

  it("calculates portfolio annual generation for 216 kW", () => {
    expect(calculatePortfolioAnnualGeneration(216, 1400)).toBe(302400);
  });

  it("returns zero for invalid or negative capacity and rate", () => {
    expect(calculateAnnualGeneration("bad", 1400)).toBe(0);
    expect(calculateAnnualGeneration(-2, 1400)).toBe(0);
    expect(calculateAnnualGeneration(3, -1)).toBe(0);
  });

  it("confirms stage-wise counts sum to 72 projects", () => {
    expect(sumStageCounts(projectTrackerFixture.stageCounts)).toBe(72);
  });

  it("returns zero for an empty stage chart and ignores invalid counts", () => {
    expect(sumStageCounts([])).toBe(0);
    expect(sumStageCounts([{ count: "bad" }, { count: -2 }, { count: 3 }])).toBe(3);
  });
});

describe("Project Tracker filters and pagination", () => {
  it("returns the six sample projects for All Projects", () => {
    expect(filterProjects(projectTrackerFixture.projects, { view: "all" }, context)).toHaveLength(6);
  });

  it("filters My Projects by the current staff ID", () => {
    const result = filterProjects(projectTrackerFixture.projects, { view: "my" }, context);
    expect(result.length).toBe(4);
    expect(result.every((project) => project.assignedToId === context.currentStaffId)).toBe(true);
  });

  it("filters overdue projects using the explicit fixture reference date", () => {
    const result = filterProjects(projectTrackerFixture.projects, { view: "overdue" }, context);
    expect(result.map((project) => project.id)).toEqual(["P-1071"]);
  });

  it("searches by project ID, customer and location case-insensitively", () => {
    expect(filterProjects(projectTrackerFixture.projects, { query: "p-1075" }, context)[0].customerName).toBe("Rohit Meshram");
    expect(filterProjects(projectTrackerFixture.projects, { query: "AYESHA" }, context)).toHaveLength(1);
    expect(filterProjects(projectTrackerFixture.projects, { query: "nashik" }, context)).toHaveLength(2);
  });

  it("applies location and stage filters together", () => {
    const result = filterProjects(projectTrackerFixture.projects, {
      view: "all",
      location: "Pune",
      stage: "subsidy-submitted",
    }, context);
    expect(result.map((project) => project.id)).toEqual(["P-1073"]);
  });

  it("filters due dates within the fixture month", () => {
    const result = filterProjects(projectTrackerFixture.projects, { dateRange: "this-month" }, context);
    expect(result).toHaveLength(6);
  });

  it("paginates sample data in stable groups of five", () => {
    const first = paginateProjects(projectTrackerFixture.projects, 1, 5);
    const second = paginateProjects(projectTrackerFixture.projects, 2, 5);
    expect(first.items).toHaveLength(5);
    expect(first.startItem).toBe(1);
    expect(first.endItem).toBe(5);
    expect(first.totalPages).toBe(2);
    expect(second.items.map((project) => project.id)).toEqual(["P-1071"]);
  });

  it("returns an empty pagination range without negative indexes", () => {
    const page = paginateProjects([], 1, 5);
    expect(page.items).toEqual([]);
    expect(page.startItem).toBe(0);
    expect(page.endItem).toBe(0);
  });
});

describe("Project Tracker stage, notes and documents", () => {
  const project = projectTrackerFixture.projects[0];

  it("reports completed, current and pending timeline stages", () => {
    expect(getProjectStageState(project, "survey-completed")).toBe("completed");
    expect(getProjectStageState(project, "installation-completed")).toBe("current");
    expect(getProjectStageState(project, "subsidy-credited")).toBe("pending");
  });

  it("returns pending for an unknown stage", () => {
    expect(getProjectStageState(project, "not-a-stage")).toBe("pending");
  });

  it("formats a valid date and safely handles missing/invalid dates", () => {
    expect(formatProjectDate("2026-11-20")).toMatch(/20 Nov 2026/);
    expect(formatProjectDate(null)).toBe("—");
    expect(formatProjectDate("not-a-date", "Unknown")).toBe("Unknown");
  });

  it("updates project stage, progress and timeline without mutating original data", () => {
    const updated = updateProjectStage(project, "net-metering-in-progress", "2026-11-18", "Meter application started");
    expect(updated.currentStageId).toBe("net-metering-in-progress");
    expect(updated.progressPercent).toBe(80);
    expect(updated.timeline.some((event) => event.stageId === "net-metering-in-progress" && event.date === "2026-11-18")).toBe(true);
    expect(updated.notes[0].text).toBe("Meter application started");
    expect(project.currentStageId).toBe("installation-completed");
  });

  it("rejects invalid stage IDs and missing dates", () => {
    expect(() => updateProjectStage(project, "missing", "2026-11-18")).toThrow("Select a valid project stage");
    expect(() => updateProjectStage(project, "survey-scheduled", "")).toThrow("Enter a valid stage date");
  });

  it("adds a trimmed note and rejects empty notes", () => {
    const updated = addProjectNote(project, "  Customer call completed  ", "Tester", "2026-11-08");
    expect(updated.notes[0].text).toBe("Customer call completed");
    expect(updated.notes[0].sessionOnly).toBe(true);
    expect(() => addProjectNote(project, "   ")).toThrow("Enter a note");
  });

  it("adds allowed local documents and rejects unsupported, empty and oversized files", () => {
    const updated = addLocalDocument(project, { name: "survey-photo.jpg", size: 2048 }, "2026-11-08");
    expect(updated.documents[0].name).toBe("survey-photo.jpg");
    expect(updated.documents[0].sessionOnly).toBe(true);
    expect(() => addLocalDocument(project, { name: "script.exe", size: 1024 })).toThrow("Only PDF, JPG and PNG");
    expect(() => addLocalDocument(project, { name: "empty.pdf", size: 0 })).toThrow("empty");
    expect(() => addLocalDocument(project, { name: "large.pdf", size: 11 * 1024 * 1024 })).toThrow("10 MB");
  });

  it("keeps the stage catalogue ordered and complete", () => {
    expect(projectStages).toHaveLength(8);
    expect(projectStages[0].id).toBe("advance-received");
    expect(projectStages.at(-1).id).toBe("subsidy-credited");
  });
});
