import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../authentication/context/AuthContext.jsx";
import { getHomeownerPortalSession } from "../services/homeowner-portal.service.js";

const HomeownerPortalContext = createContext(null);

export function HomeownerPortalProvider({ children }) {
  const { user } = useAuth();
  const [notice, setNotice] = useState(null);
  const [profileOverride, setProfileOverride] = useState(null);
  const [notificationPreferences, setNotificationPreferences] = useState({
    projectUpdates: true,
    quotationUpdates: true,
    subsidyAlerts: true,
    productUpdates: false,
  });
  const [contactPreferences, setContactPreferences] = useState({
    email: true,
    phone: true,
    whatsapp: false,
  });
  const [supportRequests, setSupportRequests] = useState([]);

  const query = useQuery({
    queryKey: ["homeowner", "portal", user?.id],
    queryFn: () => getHomeownerPortalSession(user),
    enabled: Boolean(user?.id),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (query.data?.profile) setProfileOverride(query.data.profile);
  }, [query.data?.profile]);

  const data = query.data;
  const profile = profileOverride ?? data?.profile ?? {
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    mobileNumber: String(user?.phone ?? "").replace(/^\+91\s*/, ""),
    city: "",
    state: "",
    addressLine1: "",
    pincode: "",
    propertyType: "",
    ownershipStatus: "",
    roofType: "",
    roofAreaSqFt: "",
    monthlyElectricityBill: "",
    monthlyUnits: "",
  };

  const value = useMemo(() => ({
    ...(data ?? {}),
    profile,
    setProfile: setProfileOverride,
    project: data?.project ?? null,
    projects: data?.projects ?? [],
    quotations: data?.quotations ?? [],
    documents: data?.documents ?? [],
    activities: data?.activities ?? [],
    leads: data?.leads ?? [],
    leadSubmissions: data?.leadSubmissions ?? [],
    supportRequests,
    addSupportRequest(request) {
      setSupportRequests((current) => [{
        ...request,
        id: `LOCAL-SUPPORT-${current.length + 1}`,
        createdAt: new Date().toISOString(),
      }, ...current]);
    },
    notificationPreferences,
    setNotificationPreferences,
    contactPreferences,
    setContactPreferences,
    faqs: data?.faqs ?? [],
    supportTopics: data?.supportTopics ?? [],
    notice,
    setNotice,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }), [
    data, profile, supportRequests, notificationPreferences,
    contactPreferences, notice, query.isPending, query.isError,
    query.error, query.refetch,
  ]);

  return <HomeownerPortalContext.Provider value={value}>{children}</HomeownerPortalContext.Provider>;
}

export function useHomeownerPortal() {
  const context = useContext(HomeownerPortalContext);
  if (!context) throw new Error("useHomeownerPortal must be used inside HomeownerPortalProvider.");
  return context;
}
