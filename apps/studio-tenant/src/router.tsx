/* eslint-disable max-lines */
import { createRootRoute, createRoute, createRouter, Navigate, Outlet, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@k2net/auth/client";
import { TenantOrgLayout } from "./components/layout/TenantOrgLayout";
import { TenantProjectLayout } from "./components/layout/TenantProjectLayout";
import { Button } from "@k2net/ui";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import * as React from "react";
import {
  ProjectsPageWrapper,
  TeamPageWrapper,
  IntegrationsPageWrapper,
  UsagePageWrapper,
  BillingPageWrapper,
  OrgSettingsPageWrapper,
  GisPageWrapper,
  InventoryPageWrapper,
  CorePageWrapper,
  SubscribersPageWrapper,
  IssuesPageWrapper,
  ProjectSettingsPageWrapper,
} from "./components/page-guards";

// ----------------------------------------------------------------
// Resilient dynamic import wrapper (handles post-deployment chunk 404s)
// ----------------------------------------------------------------
function lazyWithRetry(
  componentImport: () => Promise<{ default: React.ComponentType }>
) {
  return React.lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("k2net_tenant_chunk_force_refreshed") === "true"
        : false;

    try {
      const component = await componentImport();
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("k2net_tenant_chunk_force_refreshed", "false");
      }
      return component;
    } catch (error: unknown) {
      const err = error as Error | null | undefined;
      const message = err?.message || "";
      const isChunkError =
        message.includes("dynamically imported module") ||
        message.includes("Loading chunk") ||
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("error loading dynamically imported module") ||
        err?.name === "ChunkLoadError" ||
        err?.name === "TypeError";

      if (isChunkError && !pageHasAlreadyBeenForceRefreshed && typeof window !== "undefined") {
        window.sessionStorage.setItem("k2net_tenant_chunk_force_refreshed", "true");
        window.location.reload();
        return new Promise<{ default: React.ComponentType }>(() => {});
      }

      throw error;
    }
  });
}

// ----------------------------------------------------------------
// Lazy-loaded page imports (code splitting per route with auto-retry)
// ----------------------------------------------------------------

// Auth
const LoginPage = lazyWithRetry(() =>
  import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);

// Layer 1: Org Scope Pages
const ProjectsPage = lazyWithRetry(() =>
  import("./pages/org/ProjectsPage").then((m) => ({ default: m.ProjectsPage }))
);
const TeamPage = lazyWithRetry(() =>
  import("./pages/org/TeamPage").then((m) => ({ default: m.TeamPage }))
);
const IntegrationsPage = lazyWithRetry(() =>
  import("./pages/org/IntegrationsPage").then((m) => ({ default: m.IntegrationsPage }))
);
const UsagePage = lazyWithRetry(() =>
  import("./pages/org/UsagePage").then((m) => ({ default: m.UsagePage }))
);
const BillingPage = lazyWithRetry(() =>
  import("./pages/org/BillingPage").then((m) => ({ default: m.BillingPage }))
);
const OrgSettingsPage = lazyWithRetry(() =>
  import("./pages/org/OrgSettingsPage").then((m) => ({ default: m.OrgSettingsPage }))
);

// Layer 2: Project Scope Pages
const ProjectOverviewPage = lazyWithRetry(() =>
  import("./pages/project/ProjectOverviewPage").then((m) => ({ default: m.ProjectOverviewPage }))
);
// GIS
const TopologyPage = lazyWithRetry(() =>
  import("./pages/project/gis/TopologyPage").then((m) => ({ default: m.TopologyPage }))
);
const HeatmapPage = lazyWithRetry(() =>
  import("./pages/project/gis/HeatmapPage").then((m) => ({ default: m.HeatmapPage }))
);
const CanvasBuilderPage = lazyWithRetry(() =>
  import("./pages/project/gis/CanvasBuilderPage").then((m) => ({ default: m.CanvasBuilderPage }))
);
// Inventory
const OdcListPage = lazyWithRetry(() =>
  import("./pages/project/inventory/OdcListPage").then((m) => ({ default: m.OdcListPage }))
);
const OdpListPage = lazyWithRetry(() =>
  import("./pages/project/inventory/OdpListPage").then((m) => ({ default: m.OdpListPage }))
);
const CableListPage = lazyWithRetry(() =>
  import("./pages/project/inventory/CableListPage").then((m) => ({ default: m.CableListPage }))
);
const CustomerDatabasePage = lazyWithRetry(() =>
  import("./pages/project/inventory/CustomerDatabasePage").then((m) => ({ default: m.CustomerDatabasePage }))
);
const BoqGeneratorPage = lazyWithRetry(() =>
  import("./pages/project/inventory/BoqGeneratorPage").then((m) => ({ default: m.BoqGeneratorPage }))
);
// Core
const OltListPage = lazyWithRetry(() =>
  import("./pages/project/core/OltListPage").then((m) => ({ default: m.OltListPage }))
);
const RoutersListPage = lazyWithRetry(() =>
  import("./pages/project/core/RoutersListPage").then((m) => ({ default: m.RoutersListPage }))
);
const ServersListPage = lazyWithRetry(() =>
  import("./pages/project/core/ServersListPage").then((m) => ({ default: m.ServersListPage }))
);
// Users
const SubscribersListPage = lazyWithRetry(() =>
  import("./pages/project/users/SubscribersListPage").then((m) => ({ default: m.SubscribersListPage }))
);
const UserRolesPage = lazyWithRetry(() =>
  import("./pages/project/users/UserRolesPage").then((m) => ({ default: m.UserRolesPage }))
);
// Issues
const TroubleTicketsPage = lazyWithRetry(() =>
  import("./pages/project/issues/TroubleTicketsPage").then((m) => ({ default: m.TroubleTicketsPage }))
);
const DispatcherPage = lazyWithRetry(() =>
  import("./pages/project/issues/DispatcherPage").then((m) => ({ default: m.DispatcherPage }))
);
// Project Settings
const ProjectGeneralSettings = lazyWithRetry(() =>
  import("./pages/project/settings/ProjectGeneralSettings").then((m) => ({ default: m.ProjectGeneralSettings }))
);
const ProjectMembersPage = lazyWithRetry(() =>
  import("./pages/project/settings/ProjectMembersPage").then((m) => ({ default: m.ProjectMembersPage }))
);
const GisDataImportPage = lazyWithRetry(() =>
  import("./pages/project/settings/GisDataImportPage").then((m) => ({ default: m.GisDataImportPage }))
);

// ----------------------------------------------------------------
// Suspense fallback & Error Handlers
// ----------------------------------------------------------------
function PageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs font-mono text-muted-foreground">Memuat modul FTTH GIS...</span>
      </div>
    </div>
  );
}

function NotFoundFallback() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
      <div className="rounded-2xl border border-border bg-card/60 p-8 shadow-lg backdrop-blur-sm max-w-md w-full space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <span className="font-mono font-bold text-lg">404</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground">
          Rute yang Anda tuju tidak tersedia atau telah dipindahkan ke modul baru.
        </p>
        <a
          href="/projects"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Kembali ke Daftar Proyek
        </a>
      </div>
    </div>
  );
}

function RouterErrorComponent({ error, reset }: { error: unknown; reset?: () => void }) {
  const message = error instanceof Error ? error.message : String(error);
  const isChunkError =
    message.includes("dynamically imported module") ||
    message.includes("Loading chunk") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("error loading dynamically imported module");

  if (isChunkError && typeof window !== "undefined") {
    const reloaded = sessionStorage.getItem("k2net_tenant_chunk_force_refreshed");
    if (reloaded !== "true") {
      sessionStorage.setItem("k2net_tenant_chunk_force_refreshed", "true");
      window.location.reload();
      return null;
    }
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
      <div className="rounded-2xl border border-border bg-card/60 p-8 shadow-lg backdrop-blur-sm max-w-md w-full space-y-4 animate-in zoom-in duration-300">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {isChunkError ? "Pembaruan Aplikasi Tersedia" : "Terjadi Kendala Sistem"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isChunkError
            ? "Versi terbaru FTTH GIS telah diperbarui di server. Muat ulang halaman untuk memuat versi baru."
            : "Halaman tidak dapat memuat konten karena kendala jaringan atau pembaruan modul."}
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => {
              sessionStorage.removeItem("k2net_tenant_chunk_force_refreshed");
              window.location.reload();
            }}
            className="w-full text-xs font-semibold gap-2"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Muat Ulang Halaman
          </Button>
          {reset && (
            <Button
              variant="ghost"
              onClick={reset}
              className="w-full text-xs text-muted-foreground"
            >
              Coba Lagi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<PageFallback />}>{children}</React.Suspense>;
}

// ----------------------------------------------------------------
// Route Trees Definition
// ----------------------------------------------------------------
const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => <NotFoundFallback />,
  errorComponent: RouterErrorComponent,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => (
    <Lazy>
      <LoginPage />
    </Lazy>
  ),
  errorComponent: RouterErrorComponent,
});

// ================================================================
// LAYER 1: ORGANIZATION SCOPE ROUTES (TenantOrgLayout)
// ================================================================
const orgAuthenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "tenant-org-authenticated",
  component: () => (
    <ProtectedRoute>
      <TenantOrgLayout />
    </ProtectedRoute>
  ),
  errorComponent: RouterErrorComponent,
});

const rootIndexRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/",
  component: () => <Navigate to="/projects" />,
});

const projectsRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/projects",
  component: () => (
    <ProjectsPageWrapper>
      <Lazy>
        <ProjectsPage />
      </Lazy>
    </ProjectsPageWrapper>
  ),
});

const teamRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/team",
  component: () => <Navigate to="/team/members" />,
});

const teamMembersRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/team/members",
  component: () => (
    <TeamPageWrapper>
      <Lazy>
        <TeamPage />
      </Lazy>
    </TeamPageWrapper>
  ),
});

const teamRolesRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/team/roles",
  component: () => (
    <TeamPageWrapper>
      <Lazy>
        <TeamPage />
      </Lazy>
    </TeamPageWrapper>
  ),
});

const teamActivityRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/team/activity",
  component: () => (
    <TeamPageWrapper>
      <Lazy>
        <TeamPage />
      </Lazy>
    </TeamPageWrapper>
  ),
});

const integrationsRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/integrations",
  component: () => (
    <IntegrationsPageWrapper>
      <Lazy>
        <IntegrationsPage />
      </Lazy>
    </IntegrationsPageWrapper>
  ),
});

const usageRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/usage",
  component: () => (
    <UsagePageWrapper>
      <Lazy>
        <UsagePage />
      </Lazy>
    </UsagePageWrapper>
  ),
});

const billingRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/billing",
  component: () => (
    <BillingPageWrapper>
      <Lazy>
        <BillingPage />
      </Lazy>
    </BillingPageWrapper>
  ),
});

const settingsGeneralRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/settings/general",
  component: () => (
    <OrgSettingsPageWrapper>
      <Lazy>
        <OrgSettingsPage />
      </Lazy>
    </OrgSettingsPageWrapper>
  ),
});

const settingsBrandingRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/settings/branding",
  component: () => (
    <OrgSettingsPageWrapper>
      <Lazy>
        <OrgSettingsPage />
      </Lazy>
    </OrgSettingsPageWrapper>
  ),
});

const settingsSecurityRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/settings/security",
  component: () => (
    <OrgSettingsPageWrapper>
      <Lazy>
        <OrgSettingsPage />
      </Lazy>
    </OrgSettingsPageWrapper>
  ),
});

const settingsSsoRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/settings/sso",
  component: () => (
    <OrgSettingsPageWrapper>
      <Lazy>
        <OrgSettingsPage />
      </Lazy>
    </OrgSettingsPageWrapper>
  ),
});

const settingsOauthRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/settings/oauth",
  component: () => (
    <OrgSettingsPageWrapper>
      <Lazy>
        <OrgSettingsPage />
      </Lazy>
    </OrgSettingsPageWrapper>
  ),
});

const settingsAuditRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/settings/audit-logs",
  component: () => (
    <OrgSettingsPageWrapper>
      <Lazy>
        <OrgSettingsPage />
      </Lazy>
    </OrgSettingsPageWrapper>
  ),
});

const settingsFallbackRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/settings",
  component: () => <Navigate to="/settings/general" />,
});

// Legacy fallbacks
const legacyDashboardRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/dashboard",
  component: () => <Navigate to="/projects" />,
});

// ================================================================
// LAYER 2: PROJECT SCOPE ROUTES (TenantProjectLayout)
// ================================================================
const projectAuthenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/project/$projectId",
  component: () => (
    <ProtectedRoute>
      <TenantProjectLayout />
    </ProtectedRoute>
  ),
  errorComponent: RouterErrorComponent,
});

const projectIndexRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/",
  component: () => {
    return (
      <ProjectsPageWrapper>
        <Lazy>
          <ProjectOverviewPage />
        </Lazy>
      </ProjectsPageWrapper>
    );
  },
});

const projectOverviewRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/overview",
  component: () => (
    <ProjectsPageWrapper>
      <Lazy>
        <ProjectOverviewPage />
      </Lazy>
    </ProjectsPageWrapper>
  ),
});

// Infrastructure GIS
const projectTopologyRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/infrastructure/topology",
  component: () => (
    <GisPageWrapper>
      <Lazy>
        <TopologyPage />
      </Lazy>
    </GisPageWrapper>
  ),
});

const projectHeatmapRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/infrastructure/heatmap",
  component: () => (
    <GisPageWrapper>
      <Lazy>
        <HeatmapPage />
      </Lazy>
    </GisPageWrapper>
  ),
});

const projectCanvasRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/infrastructure/canvas",
  component: () => (
    <GisPageWrapper>
      <Lazy>
        <CanvasBuilderPage />
      </Lazy>
    </GisPageWrapper>
  ),
});

function ProjectInfraRedirect() {
  const { projectId } = useParams({ strict: false }) as { projectId: string };
  return <Navigate to="/project/$projectId/infrastructure/topology" params={{ projectId }} />;
}

const projectInfraFallbackRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/infrastructure",
  component: ProjectInfraRedirect,
});

// Inventory
const projectOdcRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/inventory/odc",
  component: () => (
    <InventoryPageWrapper>
      <Lazy>
        <OdcListPage />
      </Lazy>
    </InventoryPageWrapper>
  ),
});

const projectOdpRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/inventory/odp",
  component: () => (
    <InventoryPageWrapper>
      <Lazy>
        <OdpListPage />
      </Lazy>
    </InventoryPageWrapper>
  ),
});

const projectCableRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/inventory/cable",
  component: () => (
    <InventoryPageWrapper>
      <Lazy>
        <CableListPage />
      </Lazy>
    </InventoryPageWrapper>
  ),
});

const projectCustomersRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/inventory/customers",
  component: () => (
    <InventoryPageWrapper>
      <Lazy>
        <CustomerDatabasePage />
      </Lazy>
    </InventoryPageWrapper>
  ),
});

const projectBoqRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/inventory/boq",
  component: () => (
    <InventoryPageWrapper>
      <Lazy>
        <BoqGeneratorPage />
      </Lazy>
    </InventoryPageWrapper>
  ),
});

function ProjectInventoryRedirect() {
  const { projectId } = useParams({ strict: false }) as { projectId: string };
  return <Navigate to="/project/$projectId/inventory/odc" params={{ projectId }} />;
}

const projectInventoryFallbackRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/inventory",
  component: ProjectInventoryRedirect,
});

// Core Devices
const projectOltRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/core/olt",
  component: () => (
    <CorePageWrapper>
      <Lazy>
        <OltListPage />
      </Lazy>
    </CorePageWrapper>
  ),
});

const projectRoutersRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/core/routers",
  component: () => (
    <CorePageWrapper>
      <Lazy>
        <RoutersListPage />
      </Lazy>
    </CorePageWrapper>
  ),
});

const projectServersRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/core/servers",
  component: () => (
    <CorePageWrapper>
      <Lazy>
        <ServersListPage />
      </Lazy>
    </CorePageWrapper>
  ),
});

function ProjectCoreRedirect() {
  const { projectId } = useParams({ strict: false }) as { projectId: string };
  return <Navigate to="/project/$projectId/core/olt" params={{ projectId }} />;
}

const projectCoreFallbackRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/core",
  component: ProjectCoreRedirect,
});

// Subscribers & Roles
const projectSubscribersRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/users/subscribers",
  component: () => (
    <SubscribersPageWrapper>
      <Lazy>
        <SubscribersListPage />
      </Lazy>
    </SubscribersPageWrapper>
  ),
});

const projectUserRolesRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/users/roles",
  component: () => (
    <SubscribersPageWrapper>
      <Lazy>
        <UserRolesPage />
      </Lazy>
    </SubscribersPageWrapper>
  ),
});

function ProjectUsersRedirect() {
  const { projectId } = useParams({ strict: false }) as { projectId: string };
  return <Navigate to="/project/$projectId/users/subscribers" params={{ projectId }} />;
}

const projectUsersFallbackRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/users",
  component: ProjectUsersRedirect,
});

// Issues & Maintenance
const projectTicketsRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/issues/tickets",
  component: () => (
    <IssuesPageWrapper>
      <Lazy>
        <TroubleTicketsPage />
      </Lazy>
    </IssuesPageWrapper>
  ),
});

const projectDispatcherRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/issues/dispatcher",
  component: () => (
    <IssuesPageWrapper>
      <Lazy>
        <DispatcherPage />
      </Lazy>
    </IssuesPageWrapper>
  ),
});

function ProjectIssuesRedirect() {
  const { projectId } = useParams({ strict: false }) as { projectId: string };
  return <Navigate to="/project/$projectId/issues/tickets" params={{ projectId }} />;
}

const projectIssuesFallbackRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/issues",
  component: ProjectIssuesRedirect,
});

// Project Settings
const projectGeneralSettingsRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/settings/general",
  component: () => (
    <ProjectSettingsPageWrapper>
      <Lazy>
        <ProjectGeneralSettings />
      </Lazy>
    </ProjectSettingsPageWrapper>
  ),
});

const projectMembersRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/settings/members",
  component: () => (
    <ProjectSettingsPageWrapper>
      <Lazy>
        <ProjectMembersPage />
      </Lazy>
    </ProjectSettingsPageWrapper>
  ),
});

const projectImportRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/settings/import",
  component: () => (
    <ProjectSettingsPageWrapper>
      <Lazy>
        <GisDataImportPage />
      </Lazy>
    </ProjectSettingsPageWrapper>
  ),
});

function ProjectSettingsRedirect() {
  const { projectId } = useParams({ strict: false }) as { projectId: string };
  return <Navigate to="/project/$projectId/settings/general" params={{ projectId }} />;
}

const projectSettingsFallbackRoute = createRoute({
  getParentRoute: () => projectAuthenticatedRoute,
  path: "/settings",
  component: ProjectSettingsRedirect,
});

// Legacy redirects
const legacyMapRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/map",
  component: () => <Navigate to="/project/$projectId/infrastructure/topology" params={{ projectId: "proj-bdg-01" }} />,
});

const legacyCustomersRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/customers",
  component: () => <Navigate to="/project/$projectId/inventory/customers" params={{ projectId: "proj-bdg-01" }} />,
});

const legacyInventoryRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/inventory",
  component: () => <Navigate to="/project/$projectId/inventory/odc" params={{ projectId: "proj-bdg-01" }} />,
});

const legacyIssuesRoute = createRoute({
  getParentRoute: () => orgAuthenticatedRoute,
  path: "/issues",
  component: () => <Navigate to="/project/$projectId/issues/tickets" params={{ projectId: "proj-bdg-01" }} />,
});

// ================================================================
// Assemble Route Trees
// ================================================================
const orgTree = orgAuthenticatedRoute.addChildren([
  rootIndexRoute,
  projectsRoute,
  teamRoute,
  teamMembersRoute,
  teamRolesRoute,
  teamActivityRoute,
  integrationsRoute,
  usageRoute,
  billingRoute,
  settingsGeneralRoute,
  settingsBrandingRoute,
  settingsSecurityRoute,
  settingsSsoRoute,
  settingsOauthRoute,
  settingsAuditRoute,
  settingsFallbackRoute,
  legacyDashboardRoute,
  legacyMapRoute,
  legacyCustomersRoute,
  legacyInventoryRoute,
  legacyIssuesRoute,
]);

const projectTree = projectAuthenticatedRoute.addChildren([
  projectIndexRoute,
  projectOverviewRoute,
  projectTopologyRoute,
  projectHeatmapRoute,
  projectCanvasRoute,
  projectInfraFallbackRoute,
  projectOdcRoute,
  projectOdpRoute,
  projectCableRoute,
  projectCustomersRoute,
  projectBoqRoute,
  projectInventoryFallbackRoute,
  projectOltRoute,
  projectRoutersRoute,
  projectServersRoute,
  projectCoreFallbackRoute,
  projectSubscribersRoute,
  projectUserRolesRoute,
  projectUsersFallbackRoute,
  projectTicketsRoute,
  projectDispatcherRoute,
  projectIssuesFallbackRoute,
  projectGeneralSettingsRoute,
  projectMembersRoute,
  projectImportRoute,
  projectSettingsFallbackRoute,
]);

const routeTree = rootRoute.addChildren([orgTree, projectTree, loginRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 30000,
  defaultErrorComponent: RouterErrorComponent,
  defaultNotFoundComponent: NotFoundFallback,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
