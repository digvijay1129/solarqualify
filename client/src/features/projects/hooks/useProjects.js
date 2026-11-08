import { useQuery } from "@tanstack/react-query";
import { getProjectTrackerData } from "../services/projects.service.js";

export function useProjects() {
  return useQuery({
    queryKey: ["projects", "tracker"],
    queryFn: getProjectTrackerData,
    staleTime: 60_000,
  });
}
