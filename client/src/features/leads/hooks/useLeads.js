import { useQuery } from "@tanstack/react-query";
import {
  getLeadsOverview,
  getLeads,
  getLeadById,
  getLeadQualification,
} from "../services/leads.service.js";

export const leadsQueryKeys = {
  all: ["leads"],
  overview: () => ["leads", "overview"],
  lists: () => ["leads", "list"],
  list: (filters = {}) => ["leads", "list", filters],
  details: () => ["leads", "detail"],
  detail: (leadId) => ["leads", "detail", leadId],
  qualification: (leadId) => ["leads", "qualification", leadId],
};

export function useLeadsOverview() {
  return useQuery({
    queryKey: leadsQueryKeys.overview(),
    queryFn: getLeadsOverview,
  });
}

export function useLeads(filters = {}) {
  return useQuery({
    queryKey: leadsQueryKeys.list(filters),
    queryFn: () => getLeads(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useLeadDetails(leadId) {
  return useQuery({
    queryKey: leadsQueryKeys.detail(leadId),
    queryFn: () => getLeadById(leadId),
    enabled: Boolean(leadId),
  });
}

export function useLeadQualification(leadId) {
  return useQuery({
    queryKey: leadsQueryKeys.qualification(leadId),
    queryFn: () => getLeadQualification(leadId),
    enabled: Boolean(leadId),
    retry: (failureCount, error) => error?.status !== 404 && failureCount < 1,
  });
}
