import {
  LayoutDashboard,
  Users,
  FileSearch,
  FileText,
  FolderKanban,
  SlidersHorizontal,
  LifeBuoy,
} from "lucide-react";

export const salesNavigationItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
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
    icon: FileText,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Pricing & Subsidy",
    path: "/pricing",
    icon: SlidersHorizontal,
  },
  {
    label: "Help & Support",
    path: "/support",
    icon: LifeBuoy,
  },
];