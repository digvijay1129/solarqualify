/**
 * SolarQualify Lead Management demo fixture.
 *
 * Customer records are reused from the existing dashboard fixture.
 * Summary and status counts are illustrative values taken from
 * the approved UI reference, not verified company statistics.
 *
 * Replace this fixture through the API-backed repository
 * during backend integration.
 */

export const leadsOverviewFixture = {
  dataMode: "demo",

  dataLabel: "Illustrative demonstration data",

  summarySource:
    "Illustrative values from the approved Lead Management UI reference.",

  summary: {
    totalLeads: 1400,
    newLeads: 264,
    qualifiedLeads: 182,
    inProgressLeads: 96,
    growth: {
      totalLeads: 12.5,
      newLeads: 15.2,
      qualifiedLeads: 18.3,
      inProgressLeads: 7.9,
    },
  },

  statusCounts: {
    all: 1400,
    new: 264,
    qualified: 182,
    "in-progress": 96,
    converted: 72,
    lost: 12,
  },

  statuses: [
    { id: "all", label: "All Leads" },
    { id: "new", label: "New" },
    { id: "qualified", label: "Qualified" },
    { id: "in-progress", label: "In Progress" },
    { id: "converted", label: "Converted" },
    { id: "lost", label: "Lost" },
  ],

  priorities: [
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
  ],

  leads: [
    {
      id: "demo-lead-001",
      referenceId: "L-1076",
      name: "Prashant Wankhede",
      monthlyBill: 3200,
      monthlyUnits: 340,
      ownership: "Owner",
      priority: "High",
      status: "Qualified",
      recommendedSystemKw: 3,
      location: null,
      phone: null,
      email: null,
    },
    {
      id: "demo-lead-002",
      referenceId: "L-1075",
      name: "Rohit Meshram",
      monthlyBill: 1900,
      monthlyUnits: 210,
      ownership: "Tenant",
      priority: "Low",
      status: "In Progress",
      recommendedSystemKw: null,
      location: null,
      phone: null,
      email: null,
    },
    {
      id: "demo-lead-003",
      referenceId: "L-1074",
      name: "Ayesha Siddiqui",
      monthlyBill: 650,
      monthlyUnits: 85,
      ownership: "Owner",
      priority: "Low",
      status: "New",
      recommendedSystemKw: null,
      location: null,
      phone: null,
      email: null,
    },
  ],
};