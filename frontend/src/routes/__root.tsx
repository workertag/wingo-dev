import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet, useLocation } from "@tanstack/react-router";

import { BaseLayout } from "@/components/layout/base-layout";
import { adminMenuItems, publicMenuItems } from "@/config/menu";
import { AuthProvider, useAuth } from "@/context/AuthContext";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayoutInner() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  const isPublicRoute = location.pathname === "/" || location.pathname === "/history" || location.pathname === "/analytics";
  // Always show admin menus if they are logged in as admin
  const menuItems = isAdmin ? adminMenuItems : publicMenuItems;

  return (
    <BaseLayout menuItems={menuItems}>
      <Outlet />
    </BaseLayout>
  );
}

function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
