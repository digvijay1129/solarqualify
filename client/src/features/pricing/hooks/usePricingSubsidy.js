import { useQuery } from "@tanstack/react-query";
import { fetchPricingSubsidyConfiguration } from "../services/pricing-subsidy.service.js";

export const pricingSubsidyQueryKey = ["pricing-subsidy", "configuration"];

export function usePricingSubsidy() {
  return useQuery({
    queryKey: pricingSubsidyQueryKey,
    queryFn: fetchPricingSubsidyConfiguration,
    staleTime: 60_000,
  });
}
