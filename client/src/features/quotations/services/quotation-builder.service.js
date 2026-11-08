import { getQuotationBuilderSession } from "../../../mocks/repositories/quotation-builder.repository.js";

export async function getQuotationBuilderData() {
  return getQuotationBuilderSession();
}
