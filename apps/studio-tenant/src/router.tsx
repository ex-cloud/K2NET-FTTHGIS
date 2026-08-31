import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { ProtectedRoute } from "@k2net/auth/client";
import { TenantLayout } from "./layouts/TenantLayout";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { MapPage } from "./pages/map/MapPage";
import { CustomersPage } from "./pages/customers/CustomersPage";

const rootRoute = createRootRoute({
  component: () => (
    <ProtectedRoute>
      <TenantLayout />
    </ProtectedRoute>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/map",
  component: MapPage,
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: CustomersPage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory",
  component: DashboardPage,
});

const issuesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/issues",
  component: DashboardPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: DashboardPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  mapRoute,
  customersRoute,
  inventoryRoute,
  issuesRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
