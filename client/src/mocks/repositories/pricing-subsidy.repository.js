import { pricingSubsidyFixture } from "../fixtures/pricing-subsidy.fixture.js";

export async function getPricingSubsidyConfiguration() {
  return structuredClone(pricingSubsidyFixture);
}
