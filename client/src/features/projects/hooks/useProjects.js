import { useQuery } from "@tanstack/react-query";
import {
  getProjectById,
  getProjectNotificationHistory,
  getProjectTrackerData,
} from "../services/projects.service.js";

export const projectQueryKeys = {
  all: ["projects"],
  lists: () => ["projects", "list"],
  list: (filters) => ["projects", "list", filters],
  detail: (projectId) => ["projects", "detail", projectId],
  notifications: (projectId) => ["projects", "notifications", projectId],
};

export function useProjects(filters = {}) {
  return useQuery({
    queryKey: projectQueryKeys.list(filters),
    queryFn: () => getProjectTrackerData(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 15_000,
  });
}

export function useProjectDetails(projectId) {
  return useQuery({
    queryKey: projectQueryKeys.detail(projectId),
    queryFn: () => getProjectById(projectId),
    enabled: Boolean(projectId),
    staleTime: 10_000,
  });
}

export function useProjectNotifications(projectId) {
  return useQuery({
    queryKey: projectQueryKeys.notifications(projectId),
    queryFn: () => getProjectNotificationHistory(projectId),
    enabled: Boolean(projectId),
    staleTime: 10_000,
  });
}
