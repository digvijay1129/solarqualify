import { useQuery } from "@tanstack/react-query";
import { getDashboardOverview } from "../services/dashboard.service.js";

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: getDashboardOverview,
  });
}