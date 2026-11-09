import { useQuery } from "@tanstack/react-query";
import { getDashboardOverview } from "../services/dashboard.service.js";

export function useDashboardOverview(months = 12) {
  return useQuery({
    queryKey: ["dashboard", "overview", months],
    queryFn: () => getDashboardOverview({ months }),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
