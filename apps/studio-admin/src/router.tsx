import { createRootRoute, createRoute, createRouter, Navigate, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@k2net/auth/client";
import { AdminLayout } from "./layouts/AdminLayout";
import { Button } from "@k2net/ui";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import * as React from "react";

// ----------------------------------------------------------------
// Resilient dynamic import wrapper (handles post-deployment chunk 404s)
// ----------------------------------------------------------------
function lazyWithRetry(
  componentImport: () => Promise<{ default: React.ComponentType }>
) {
  return React.lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("k2net_chunk_force_refreshed") === "true"
        : false;

    try {
      const component = await componentImport();
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("k2net_chunk_force_refreshed", "false");
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
        window.sessionStorage.setItem("k2net_chunk_force_refreshed", "true");
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
const SystemOverviewPage = lazyWithRetry(() =>
  import("./app/(dashboard)/overview/page").then((m) => ({ default: m.default }))
);
const OrganizationsPage = lazyWithRetry(() =>
  import("./app/(dashboard)/organizations/page").then((m) => ({ default: m.default }))
);
const OrganizationSlugPage = lazyWithRetry(() =>
  import("./app/(dashboard)/organizations/[slug]/page").then((m) => ({ default: m.default }))
);
const OrganizationQuotasPage = lazyWithRetry(() =>
  import("./app/(dashboard)/organizations/quotas/page").then((m) => ({ default: m.default }))
);
const OrganizationFeaturesPage = lazyWithRetry(() =>
  import("./app/(dashboard)/organizations/features/page").then((m) => ({ default: m.default }))
);
const OrganizationDomainsPage = lazyWithRetry(() =>
  import("./app/(dashboard)/organizations/domains/page").then((m) => ({ default: m.default }))
);
const OrganizationVpnPage = lazyWithRetry(() =>
  import("./app/(dashboard)/organizations/vpn/page").then((m) => ({ default: m.default }))
);
const OrganizationImpersonationPage = lazyWithRetry(() =>
  import("./app/(dashboard)/organizations/impersonation/page").then((m) => ({ default: m.default }))
);
const UsersPage = lazyWithRetry(() =>
  import("./app/(dashboard)/users/page").then((m) => ({ default: m.default }))
);
const UsersRolesPage = lazyWithRetry(() =>
  import("./app/(dashboard)/users/roles/page").then((m) => ({ default: m.default }))
);
const UsersSessionsPage = lazyWithRetry(() =>
  import("./app/(dashboard)/users/sessions/page").then((m) => ({ default: m.default }))
);
const ObservabilityOverviewPage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/overview/page").then((m) => ({ default: m.default }))
);
const ObservabilityApiGatewayPage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/api-gateway/page").then((m) => ({ default: m.default }))
);
const ObservabilityComputePage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/compute/page").then((m) => ({ default: m.default }))
);
const ObservabilityDatabasePage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/database/page").then((m) => ({ default: m.default }))
);
const ObservabilityIdentityPage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/identity/page").then((m) => ({ default: m.default }))
);
const ObservabilityMessagingPage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/messaging/page").then((m) => ({ default: m.default }))
);
const ObservabilityOltPollerPage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/olt-poller/page").then((m) => ({ default: m.default }))
);
const ObservabilitySchedulerPage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/scheduler/page").then((m) => ({ default: m.default }))
);
const ObservabilityQueryPerfPage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/query-performance/page").then((m) => ({ default: m.default }))
);
const ObservabilitySpatialMapPage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/spatial-map/page").then((m) => ({ default: m.default }))
);
const GatewaysOverviewPage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/overview/page").then((m) => ({ default: m.default }))
);
const GatewaysNotificationPage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/notification/page").then((m) => ({ default: m.default }))
);
const GatewaysPaymentPage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/payment/page").then((m) => ({ default: m.default }))
);
const GatewaysMapPage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/map/page").then((m) => ({ default: m.default }))
);
const GatewaysStoragePage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/storage/page").then((m) => ({ default: m.default }))
);
const GatewaysWhatsappPage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/whatsapp/page").then((m) => ({ default: m.default }))
);
const GatewaysSchedulerPage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/scheduler/page").then((m) => ({ default: m.default }))
);
const GatewaysExportPage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/export/page").then((m) => ({ default: m.default }))
);
const GatewaysOltPage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/olt/page").then((m) => ({ default: m.default }))
);
const GatewaysAuditPage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/audit/page").then((m) => ({ default: m.default }))
);
const GatewaysPollerPage = lazyWithRetry(() =>
  import("./app/(dashboard)/gateways/poller/page").then((m) => ({ default: m.default }))
);
const SecurityAlertsPage = lazyWithRetry(() =>
  import("./app/(dashboard)/security/alerts/page").then((m) => ({ default: m.default }))
);
const SecurityAuditPage = lazyWithRetry(() =>
  import("./app/(dashboard)/security/audit/page").then((m) => ({ default: m.default }))
);
const SecurityAuthPage = lazyWithRetry(() =>
  import("./app/(dashboard)/security/auth/page").then((m) => ({ default: m.default }))
);
const SecurityCompliancePage = lazyWithRetry(() =>
  import("./app/(dashboard)/security/compliance/page").then((m) => ({ default: m.default }))
);
const SecurityRolesPage = lazyWithRetry(() =>
  import("./app/(dashboard)/security/roles/page").then((m) => ({ default: m.default }))
);
const SecurityPermissionsPage = lazyWithRetry(() =>
  import("./app/(dashboard)/security/permissions/page").then((m) => ({ default: m.default }))
);
const SecurityPasswordPolicyPage = lazyWithRetry(() =>
  import("./app/(dashboard)/security/password-policy/page").then((m) => ({ default: m.default }))
);
const LogsPage = lazyWithRetry(() =>
  import("./app/(dashboard)/logs/page").then((m) => ({ default: m.default }))
);
const TasksPage = lazyWithRetry(() =>
  import("./app/(dashboard)/tasks/page").then((m) => ({ default: m.default }))
);
const TasksNewPage = lazyWithRetry(() =>
  import("./app/(dashboard)/tasks/new/page").then((m) => ({ default: m.default }))
);
const TasksIdPage = lazyWithRetry(() =>
  import("./app/(dashboard)/tasks/[id]/page").then((m) => ({ default: m.default }))
);
const TasksProjectsPage = lazyWithRetry(() =>
  import("./app/(dashboard)/tasks/projects/page").then((m) => ({ default: m.default }))
);
const TasksProjectIdPage = lazyWithRetry(() =>
  import("./app/(dashboard)/tasks/projects/[id]/page").then((m) => ({ default: m.default }))
);
const AiPage = lazyWithRetry(() =>
  import("./app/(dashboard)/ai/page").then((m) => ({ default: m.default }))
);
const AiAddPage = lazyWithRetry(() =>
  import("./app/(dashboard)/ai/add/page").then((m) => ({ default: m.default }))
);
const AiConfigPage = lazyWithRetry(() =>
  import("./app/(dashboard)/ai/config/page").then((m) => ({ default: m.default }))
);
const AiTemplatesPage = lazyWithRetry(() =>
  import("./app/(dashboard)/ai/templates/page").then((m) => ({ default: m.default }))
);
const AiPromptsPage = lazyWithRetry(() =>
  import("./app/(dashboard)/ai/prompts/page").then((m) => ({ default: m.default }))
);
const AiSimulatorPage = lazyWithRetry(() =>
  import("./app/(dashboard)/ai/simulator/page").then((m) => ({ default: m.default }))
);
const AiGraphPage = lazyWithRetry(() =>
  import("./app/(dashboard)/ai/graph/page").then((m) => ({ default: m.default }))
);
const SettingsGeneralPage = lazyWithRetry(() =>
  import("./app/(dashboard)/settings/general/page").then((m) => ({ default: m.default }))
);
const SettingsBrandingPage = lazyWithRetry(() =>
  import("./app/(dashboard)/settings/branding/page").then((m) => ({ default: m.default }))
);
const SettingsSmtpPage = lazyWithRetry(() =>
  import("./app/(dashboard)/settings/smtp-mail/page").then((m) => ({ default: m.default }))
);
const SettingsGisSpatialPage = lazyWithRetry(() =>
  import("./app/(dashboard)/settings/gis-spatial/page").then((m) => ({ default: m.default }))
);
const Assets3dPage = lazyWithRetry(() =>
  import("./app/(dashboard)/assets-3d/page").then((m) => ({ default: m.default }))
);
const SystemTrashPage = lazyWithRetry(() =>
  import("./app/(dashboard)/system/trash/page").then((m) => ({ default: m.default }))
);
const ObservabilityOperationsPage = lazyWithRetry(() =>
  import("./app/(dashboard)/observability/operations/page").then((m) => ({ default: m.default }))
);
const LoginPage = lazyWithRetry(() =>
  import("./app/login/page").then((m) => ({ default: m.default }))
);

// ----------------------------------------------------------------
// Suspense fallback & Error Handlers
// ----------------------------------------------------------------
function PageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs font-mono text-muted-foreground">Memuat halaman...</span>
      </div>
    </div>
  );
}

function NotFoundFallback() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
      <div className="rounded-2xl border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-sm max-w-md w-full space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <span className="font-mono font-bold text-lg">404</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground">
          Rute yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <a
          href="/overview"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Kembali ke Overview
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
    const reloaded = sessionStorage.getItem("k2net_chunk_force_refreshed");
    if (reloaded !== "true") {
      sessionStorage.setItem("k2net_chunk_force_refreshed", "true");
      window.location.reload();
      return null;
    }
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
      <div className="rounded-2xl border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-sm max-w-md w-full space-y-4 animate-in zoom-in duration-300">
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
              sessionStorage.removeItem("k2net_chunk_force_refreshed");
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
// Routes
// ----------------------------------------------------------------
const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => <NotFoundFallback />,
  errorComponent: RouterErrorComponent,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <Lazy><LoginPage /></Lazy>,
  errorComponent: RouterErrorComponent,
});

const authenticatedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "admin-authenticated",
  component: () => (
    <ProtectedRoute requiredRoles={["super_admin"]}>
      <AdminLayout />
    </ProtectedRoute>
  ),
  errorComponent: RouterErrorComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/",
  component: () => <Navigate to="/overview" />,
});

const overviewRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/overview",
  component: () => <Lazy><SystemOverviewPage /></Lazy>,
});

// Organizations
const orgsRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/organizations", component: () => <Lazy><OrganizationsPage /></Lazy> });
const orgSlugRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/organizations/$slug", component: () => <Lazy><OrganizationSlugPage /></Lazy> });
const orgQuotasRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/organizations/quotas", component: () => <Lazy><OrganizationQuotasPage /></Lazy> });
const orgFeaturesRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/organizations/features", component: () => <Lazy><OrganizationFeaturesPage /></Lazy> });
const orgDomainsRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/organizations/domains", component: () => <Lazy><OrganizationDomainsPage /></Lazy> });
const orgVpnRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/organizations/vpn", component: () => <Lazy><OrganizationVpnPage /></Lazy> });
const orgImpersonationRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/organizations/impersonation", component: () => <Lazy><OrganizationImpersonationPage /></Lazy> });

// Users
const usersRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/users", component: () => <Lazy><UsersPage /></Lazy> });
const usersRolesRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/users/roles", component: () => <Lazy><UsersRolesPage /></Lazy> });
const usersSessionsRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/users/sessions", component: () => <Lazy><UsersSessionsPage /></Lazy> });

// Observability
const obsOverviewRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/overview", component: () => <Lazy><ObservabilityOverviewPage /></Lazy> });
const obsApiGatewayRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/api-gateway", component: () => <Lazy><ObservabilityApiGatewayPage /></Lazy> });
const obsComputeRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/compute", component: () => <Lazy><ObservabilityComputePage /></Lazy> });
const obsDatabaseRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/database", component: () => <Lazy><ObservabilityDatabasePage /></Lazy> });
const obsIdentityRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/identity", component: () => <Lazy><ObservabilityIdentityPage /></Lazy> });
const obsMessagingRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/messaging", component: () => <Lazy><ObservabilityMessagingPage /></Lazy> });
const obsOltPollerRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/olt-poller", component: () => <Lazy><ObservabilityOltPollerPage /></Lazy> });
const obsSchedulerRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/scheduler", component: () => <Lazy><ObservabilitySchedulerPage /></Lazy> });
const obsQueryPerfRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/query-performance", component: () => <Lazy><ObservabilityQueryPerfPage /></Lazy> });
const obsSpatialMapRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/spatial-map", component: () => <Lazy><ObservabilitySpatialMapPage /></Lazy> });
const obsOperationsRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability/operations", component: () => <Lazy><ObservabilityOperationsPage /></Lazy> });
const obsRedirectRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/observability", component: () => <Navigate to="/observability/overview" /> });

// Gateways
const gatewaysOverviewRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/overview", component: () => <Lazy><GatewaysOverviewPage /></Lazy> });
const gatewaysRedirectRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways", component: () => <Navigate to="/gateways/overview" /> });
const gatewaysNotifRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/notification", component: () => <Lazy><GatewaysNotificationPage /></Lazy> });
const gatewaysPaymentRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/payment", component: () => <Lazy><GatewaysPaymentPage /></Lazy> });
const gatewaysMapRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/map", component: () => <Lazy><GatewaysMapPage /></Lazy> });
const gatewaysStorageRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/storage", component: () => <Lazy><GatewaysStoragePage /></Lazy> });
const gatewaysWhatsappRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/whatsapp", component: () => <Lazy><GatewaysWhatsappPage /></Lazy> });
const gatewaysSchedulerRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/scheduler", component: () => <Lazy><GatewaysSchedulerPage /></Lazy> });
const gatewaysExportRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/export", component: () => <Lazy><GatewaysExportPage /></Lazy> });
const gatewaysOltRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/olt", component: () => <Lazy><GatewaysOltPage /></Lazy> });
const gatewaysAuditRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/audit", component: () => <Lazy><GatewaysAuditPage /></Lazy> });
const gatewaysPollerRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/gateways/poller", component: () => <Lazy><GatewaysPollerPage /></Lazy> });

// Security
const securityRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/security", component: () => <Navigate to="/security/alerts" /> });

const securityAlertsRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/security/alerts", component: () => <Lazy><SecurityAlertsPage /></Lazy> });
const securityAuditRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/security/audit", component: () => <Lazy><SecurityAuditPage /></Lazy> });
const securityAuthRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/security/auth", component: () => <Lazy><SecurityAuthPage /></Lazy> });
const securitySsoRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/security/sso", component: () => <Lazy><SecurityAuthPage /></Lazy> });
const securityComplianceRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/security/compliance", component: () => <Lazy><SecurityCompliancePage /></Lazy> });
const securityRolesRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/security/roles", component: () => <Lazy><SecurityRolesPage /></Lazy> });
const securityPermissionsRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/security/permissions", component: () => <Lazy><SecurityPermissionsPage /></Lazy> });
const securityPasswordRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/security/password-policy", component: () => <Lazy><SecurityPasswordPolicyPage /></Lazy> });

// Logs
const logsRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/logs", component: () => <Lazy><LogsPage /></Lazy> });

// Tasks
const tasksRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/tasks", component: () => <Lazy><TasksPage /></Lazy> });
const tasksNewRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/tasks/new", component: () => <Lazy><TasksNewPage /></Lazy> });
const tasksIdRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/tasks/$id", component: () => <Lazy><TasksIdPage /></Lazy> });
const tasksProjectsRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/tasks/projects", component: () => <Lazy><TasksProjectsPage /></Lazy> });
const tasksProjectIdRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/tasks/projects/$id", component: () => <Lazy><TasksProjectIdPage /></Lazy> });

// AI
const aiRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/ai", component: () => <Lazy><AiPage /></Lazy> });
const aiAddRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/ai/add", component: () => <Lazy><AiAddPage /></Lazy> });
const aiConfigRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/ai/config", component: () => <Lazy><AiConfigPage /></Lazy> });
const aiTemplatesRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/ai/templates", component: () => <Lazy><AiTemplatesPage /></Lazy> });
const aiPromptsRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/ai/prompts", component: () => <Lazy><AiPromptsPage /></Lazy> });
const aiSimulatorRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/ai/simulator", component: () => <Lazy><AiSimulatorPage /></Lazy> });
const aiGraphRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/ai/graph", component: () => <Lazy><AiGraphPage /></Lazy> });

// Settings
const settingsRedirectRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/settings", component: () => <Navigate to="/settings/general" /> });
const settingsGeneralRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/settings/general", component: () => <Lazy><SettingsGeneralPage /></Lazy> });
const settingsBrandingRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/settings/branding", component: () => <Lazy><SettingsBrandingPage /></Lazy> });
const settingsSmtpRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/settings/smtp-mail", component: () => <Lazy><SettingsSmtpPage /></Lazy> });
const settingsGisSpatialRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/settings/gis-spatial", component: () => <Lazy><SettingsGisSpatialPage /></Lazy> });

// System (Recycle Bin / Trash Can)
const systemTrashRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/system/trash", component: () => <Lazy><SystemTrashPage /></Lazy> });
const trashRedirectRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/trash", component: () => <Navigate to="/system/trash" /> });

// Assets 3D
const assets3dRoute = createRoute({ getParentRoute: () => authenticatedLayoutRoute, path: "/assets-3d", component: () => <Lazy><Assets3dPage /></Lazy> });

// ----------------------------------------------------------------
// Route tree
// ----------------------------------------------------------------
const authenticatedTree = authenticatedLayoutRoute.addChildren([
  indexRoute,
  overviewRoute,
  // Orgs
  orgsRoute, orgSlugRoute, orgQuotasRoute, orgFeaturesRoute, orgDomainsRoute, orgVpnRoute, orgImpersonationRoute,
  // Users
  usersRoute, usersRolesRoute, usersSessionsRoute,
  // Observability
  obsRedirectRoute, obsOverviewRoute, obsApiGatewayRoute, obsComputeRoute, obsDatabaseRoute,
  obsIdentityRoute, obsMessagingRoute, obsOltPollerRoute, obsSchedulerRoute, obsQueryPerfRoute, obsSpatialMapRoute,
  obsOperationsRoute,
  // Gateways
  gatewaysRedirectRoute, gatewaysOverviewRoute, gatewaysNotifRoute, gatewaysPaymentRoute, gatewaysMapRoute,
  gatewaysStorageRoute, gatewaysWhatsappRoute, gatewaysSchedulerRoute, gatewaysExportRoute,
  gatewaysOltRoute, gatewaysAuditRoute, gatewaysPollerRoute,
  // Security
  securityRoute, securityAlertsRoute, securityAuditRoute, securityAuthRoute, securitySsoRoute,
  securityComplianceRoute, securityRolesRoute, securityPermissionsRoute, securityPasswordRoute,
  // Others
  logsRoute,
  tasksRoute, tasksNewRoute, tasksIdRoute, tasksProjectsRoute, tasksProjectIdRoute,
  aiRoute, aiAddRoute, aiConfigRoute, aiTemplatesRoute, aiPromptsRoute, aiSimulatorRoute, aiGraphRoute,
  settingsRedirectRoute, settingsGeneralRoute, settingsBrandingRoute, settingsSmtpRoute, settingsGisSpatialRoute,
  // System
  systemTrashRoute, trashRedirectRoute,
  assets3dRoute,
]);

const routeTree = rootRoute.addChildren([authenticatedTree, loginRoute]);

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
