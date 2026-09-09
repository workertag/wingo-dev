import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

import { BaseLayout } from "@/components/layout/base-layout";
import { adminMenuItems } from "@/config/menu";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <BaseLayout menuItems={adminMenuItems}>
      <Outlet />

    </BaseLayout>
  );
}
