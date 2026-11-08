import { createContext, useContext, useMemo, useState } from "react";
import { getHomeownerPortalDemoData } from "../../../mocks/repositories/homeowner-portal.repository.js";

const HomeownerPortalContext = createContext(null);

export function HomeownerPortalProvider({ children }) {
  const [initialData] = useState(() => getHomeownerPortalDemoData());
  const [profile, setProfile] = useState(initialData.profile);
  const [documents, setDocuments] = useState(initialData.documents);
  const [leadSubmissions, setLeadSubmissions] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState(initialData.notificationPreferences);
  const [contactPreferences, setContactPreferences] = useState(initialData.contactPreferences);
  const [quoteDecisions, setQuoteDecisions] = useState({});
  const [notice, setNotice] = useState(null);

  const value = useMemo(() => ({
    ...initialData,
    profile,
    setProfile,
    documents,
    setDocuments,
    leadSubmissions,
    setLeadSubmissions,
    supportRequests,
    setSupportRequests,
    notificationPreferences,
    setNotificationPreferences,
    contactPreferences,
    setContactPreferences,
    quoteDecisions,
    setQuoteDecisions,
    notice,
    setNotice,
    addDocument(document) { setDocuments((current) => [document, ...current]); },
    removeDocument(documentId) { setDocuments((current) => current.filter((item) => item.id !== documentId)); },
    submitLead(lead) { const id = `DEMO-LEAD-${String(Date.now()).slice(-6)}`; setLeadSubmissions((current) => [{ ...lead, id, submittedAt: new Date().toISOString() }, ...current]); return id; },
    addSupportRequest(request) { setSupportRequests((current) => [{ ...request, id: `DEMO-SUPPORT-${String(current.length + 1).padStart(3, "0")}`, createdAt: new Date().toISOString() }, ...current]); },
    updateQuoteDecision(quotationId, decision) { setQuoteDecisions((current) => ({ ...current, [quotationId]: decision })); },
  }), [initialData, profile, documents, leadSubmissions, supportRequests, notificationPreferences, contactPreferences, quoteDecisions, notice]);

  return <HomeownerPortalContext.Provider value={value}>{children}</HomeownerPortalContext.Provider>;
}

export function useHomeownerPortal() {
  const context = useContext(HomeownerPortalContext);
  if (!context) throw new Error("useHomeownerPortal must be used inside HomeownerPortalProvider.");
  return context;
}
