import { useQuery } from "@tanstack/react-query";
import { getQuotationBuilderData } from "../services/quotation-builder.service.js";

export const quotationBuilderKeys = {
  all: ["quotation-builder"],
  session: () => [...quotationBuilderKeys.all, "session"],
};

export function useQuotationBuilder() {
  return useQuery({
    queryKey: quotationBuilderKeys.session(),
    queryFn: getQuotationBuilderData,
  });
}
