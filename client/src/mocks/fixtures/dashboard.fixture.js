export const dashboardOverviewFixture = {
  dataMode: "demo",
  dataLabel: "Illustrative demo data",

  kpis: [
    {
      id: "total-leads",
      label: "Total Leads",
      value: 1400,
      icon: "users",
    },
    {
      id: "high-priority",
      label: "High Priority",
      value: 248,
      icon: "target",
    },
    {
      id: "quotes-generated",
      label: "Quotes Generated",
      value: 186,
      icon: "file-text",
    },
    {
      id: "active-projects",
      label: "Active Projects",
      value: 72,
      icon: "house",
    },
  ],

  monthlyLeadTrend: [
    { month: "May", leads: 145 },
    { month: "Jun", leads: 172 },
    { month: "Jul", leads: 188 },
    { month: "Aug", leads: 214 },
    { month: "Sep", leads: 260 },
    { month: "Oct", leads: 301 },
  ],

  priorityDistribution: [
    { name: "High", value: 248 },
    { name: "Medium", value: 702 },
    { name: "Low", value: 450 },
  ],

  recentLeads: [
    {
      id: "demo-lead-001",
      name: "Prashant Wankhede",
      monthlyBill: 3200,
      monthlyUnits: 340,
      ownership: "Owner",
      priority: "High",
      recommendedSystemKw: 3,
    },
    {
      id: "demo-lead-002",
      name: "Rohit Meshram",
      monthlyBill: 1900,
      monthlyUnits: 210,
      ownership: "Tenant",
      priority: "Low",
      recommendedSystemKw: null,
    },
    {
      id: "demo-lead-003",
      name: "Ayesha Siddiqui",
      monthlyBill: 650,
      monthlyUnits: 85,
      ownership: "Owner",
      priority: "Low",
      recommendedSystemKw: null,
    },
  ],
};