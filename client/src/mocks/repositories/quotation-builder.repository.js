import { quotationBuilderFixture } from "../fixtures/quotation-builder.fixture.js";

export async function getQuotationBuilderSession() {
  return structuredClone(quotationBuilderFixture);
}
