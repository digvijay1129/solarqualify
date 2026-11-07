import {
  House,
  Users,
  FileSearch,
  IndianRupee,
  Layers,
  Percent,
  Settings,
} from "lucide-react";

export const salesNavigationItems = [
  {
    label: "Overview",
    path: "/",
    icon: House,
    end: true,
  },
  {
    label: "Leads",
    path: "/leads",
    icon: Users,
  },
  {
    label: "Bill Analysis",
    path: "/bill-analysis",
    icon: FileSearch,
  },
  {
    label: "Quotations",
    path: "/quotations",
    icon: IndianRupee,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: Layers,
  },
  {
    label: "Pricing & Subsidy",
    path: "/pricing",
    icon: Percent,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];