import { useQuery } from "@tanstack/react-query";

import {
  getLeadsOverview,
  getLeads,
  getLeadById,
} from "../services/leads.service.js";

export const leadsQueryKeys = {
  all: ["leads"],

  overview: () => ["leads", "overview"],

  lists: () => ["leads", "list"],

  list: (filters = {}) => ["leads", "list", filters],

  details: () => ["leads", "detail"],

  detail: (leadId) => ["leads", "detail", leadId],
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
  });
}

export function useLeadDetails(leadId) {
  return useQuery({
    queryKey: leadsQueryKeys.detail(leadId),
    queryFn: () => getLeadById(leadId),
    enabled: Boolean(leadId),
  });
}