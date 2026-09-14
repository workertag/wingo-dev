import {
  LayoutDashboard,
  History,
  Activity,
  Settings,
  Target,
  Clock,
  TrendingDown,
  Calendar,
  Grid,
  GitMerge,
  RotateCcw,
  Hash,
  TrendingUp,
  Zap,
  Calculator,
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
    id: "calculator",
    label: "Profit Simulator",
    icon: Calculator,
    path: "/calculator",
  },
  {
    id: "loss-streaks",
    label: "Loss-Streak Monitor",
    icon: TrendingDown,
    path: "/loss-streaks",
  },
  {
    id: "streak-timings",
    label: "Streak Timings",
    icon: Calendar,
    path: "/streak-timings",
  },
  {
    id: "pattern-lab",
    label: "Pattern Lab",
    icon: Grid,
    children: [
      {
        id: "pattern-heatmap",
        label: "Profit Heatmap",
        icon: Grid,
        path: "/pattern/heatmap",
      },
      {
        id: "pattern-sequences",
        label: "Sequence Detection",
        icon: GitMerge,
        path: "/pattern/sequences",
      },
      {
        id: "pattern-recovery",
        label: "Recovery Rate",
        icon: RotateCcw,
        path: "/pattern/recovery",
      },
      {
        id: "pattern-window-simulator",
        label: "Window Simulator",
        icon: Zap,
        path: "/pattern/window-compare",
      },
      {
        id: "pattern-hot-cold",
        label: "Hot & Cold Numbers",
        icon: Hash,
        path: "/pattern/hot-cold",
      },
      {
        id: "pattern-win-streaks",
        label: "Win Streaks",
        icon: TrendingUp,
        path: "/pattern/win-streaks",
      },
    ]
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];
