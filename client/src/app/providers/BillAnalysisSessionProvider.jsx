import { createContext, useContext, useState } from "react";

const BillAnalysisSessionContext = createContext(null);

const initialSession = {
  selectedFile: null,
  fieldValues: null,
  validationErrors: {},
  reviewMessage: "",
  confirmedValues: null,
};

export function BillAnalysisSessionProvider({ children }) {
  const [session, setSession] = useState(initialSession);

  return (
    <BillAnalysisSessionContext.Provider
      value={{ session, setSession }}
    >
      {children}
    </BillAnalysisSessionContext.Provider>
  );
}

export function useBillAnalysisSession() {
  const context = useContext(BillAnalysisSessionContext);

  if (!context) {
    throw new Error(
      "useBillAnalysisSession must be used inside BillAnalysisSessionProvider"
    );
  }

  return context;
}