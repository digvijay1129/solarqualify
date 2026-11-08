import { projectTrackerFixture, projectStages } from "../fixtures/project-tracker.fixture.js";

export async function getProjects() {
  const snapshot = structuredClone(projectTrackerFixture);
  const stageLabels = new Map(projectStages.map((stage) => [stage.id, stage.label]));

  return {
    ...snapshot,
    projects: snapshot.projects.map((project) => ({
      ...project,
      currentStageLabel: stageLabels.get(project.currentStageId) ?? "Unknown Stage",
    })),
  };
}
