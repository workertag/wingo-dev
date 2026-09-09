import {
  LayoutDashboard,
  History,
  Activity,
  Settings,
  Target,
  Clock,
} from "lucide-react";
import type { ComponentType } from "react";

export interface MenuItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  path?: string;
  search?: Record<string, unknown>;
  children?: MenuItem[];
}

export const adminMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Live Feed",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    id: "smart-feed",
    label: "Smart Feed",
    icon: Target,
    path: "/smart-feed",
  },
  {
    id: "hourly",
    label: "Hourly Accuracy",
    icon: Clock,
    path: "/hourly",
  },
  {
    id: "history",
    label: "History Logs",
    icon: History,
    path: "/history",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: Activity,
    path: "/analytics",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];
