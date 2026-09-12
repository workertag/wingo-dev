import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet, useLocation } from "@tanstack/react-router";

import { BaseLayout } from "@/components/layout/base-layout";
import { adminMenuItems, publicMenuItems } from "@/config/menu";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  const location = useLocation();
  const isPublicRoute = location.pathname === "/" || location.pathname === "/history" || location.pathname === "/analytics";
  const menuItems = isPublicRoute ? publicMenuItems : adminMenuItems;

  return (
    <BaseLayout menuItems={menuItems}>
      <Outlet />
    </BaseLayout>
  );
}
