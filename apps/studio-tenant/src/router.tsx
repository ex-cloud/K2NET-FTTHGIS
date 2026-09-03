import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@k2net/auth/client";
import { TenantLayout } from "./layouts/TenantLayout";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { MapPage } from "./pages/map/MapPage";
import { CustomersPage } from "./pages/customers/CustomersPage";
import { LoginPage } from "./pages/auth/LoginPage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const authenticatedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "authenticated",
  component: () => (
    <ProtectedRoute>
      <TenantLayout />
    </ProtectedRoute>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/",
  component: DashboardPage,
});

const mapRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/map",
  component: MapPage,
});

const customersRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/customers",
  component: CustomersPage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/inventory",
  component: DashboardPage,
});

const issuesRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/issues",
  component: DashboardPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/settings",
  component: DashboardPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const authenticatedTree = authenticatedLayoutRoute.addChildren([
  indexRoute,
  dashboardRoute,
  mapRoute,
  customersRoute,
  inventoryRoute,
  issuesRoute,
  settingsRoute,
]);

const routeTree = rootRoute.addChildren([authenticatedTree, loginRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
