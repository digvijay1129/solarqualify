import { useQuery } from "@tanstack/react-query";

import {
  getBillAnalysisSession,
} from "../services/bill-analysis.service.js";

/**
 * Retrieves Bill Analysis session data.
 */
export function useBillAnalysis() {
  return useQuery({
    queryKey: ["bill-analysis", "session"],
    queryFn: getBillAnalysisSession,
    staleTime: 30_000,
  });
}