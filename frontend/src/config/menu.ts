import {
  LayoutDashboard,
  History,
  Activity,
  Settings,
  Target,
  Clock,
  TrendingDown,
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

export const publicMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Live Feed",
    icon: LayoutDashboard,
    path: "/",
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
];

export const adminMenuItems: MenuItem[] = [
  ...publicMenuItems,

  {
    id: "hourly-pnl",
    label: "Hourly P&L",
    icon: Clock,
    path: "/hourly-pnl",
  },
  {
    id: "earnings",
    label: "Earnings",
    icon: Target,
    path: "/admin",
  },
  {
    id: "loss-streaks",
    label: "Loss-Streak Monitor",
    icon: TrendingDown,
    path: "/loss-streaks",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];
