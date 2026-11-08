import { getPricingSubsidyConfiguration } from "../../../mocks/repositories/pricing-subsidy.repository.js";

export async function fetchPricingSubsidyConfiguration() {
  return getPricingSubsidyConfiguration();
}
