import { createRootRoute, createRoute, createRouter, Navigate } from "@tanstack/react-router";
import { ProtectedRoute } from "@k2net/auth/client";
import { AdminLayout } from "./layouts/AdminLayout";
import * as React from "react";

// ----------------------------------------------------------------
// Lazy-loaded page imports (code splitting per route)
// ----------------------------------------------------------------
const SystemOverviewPage = React.lazy(() =>
  import("./app/(dashboard)/overview/page").then((m) => ({ default: m.default }))
);
const OrganizationsPage = React.lazy(() =>
  import("./app/(dashboard)/organizations/page").then((m) => ({ default: m.default }))
);
const OrganizationSlugPage = React.lazy(() =>
  import("./app/(dashboard)/organizations/[slug]/page").then((m) => ({ default: m.default }))
);
const OrganizationQuotasPage = React.lazy(() =>
  import("./app/(dashboard)/organizations/quotas/page").then((m) => ({ default: m.default }))
);
const OrganizationFeaturesPage = React.lazy(() =>
  import("./app/(dashboard)/organizations/features/page").then((m) => ({ default: m.default }))
);
const OrganizationDomainsPage = React.lazy(() =>
  import("./app/(dashboard)/organizations/domains/page").then((m) => ({ default: m.default }))
);
const OrganizationVpnPage = React.lazy(() =>
  import("./app/(dashboard)/organizations/vpn/page").then((m) => ({ default: m.default }))
);
const UsersPage = React.lazy(() =>
  import("./app/(dashboard)/users/page").then((m) => ({ default: m.default }))
);
const UsersRolesPage = React.lazy(() =>
  import("./app/(dashboard)/users/roles/page").then((m) => ({ default: m.default }))
);
const UsersSessionsPage = React.lazy(() =>
  import("./app/(dashboard)/users/sessions/page").then((m) => ({ default: m.default }))
);
const ObservabilityOverviewPage = React.lazy(() =>
  import("./app/(dashboard)/observability/overview/page").then((m) => ({ default: m.default }))
);
const ObservabilityApiGatewayPage = React.lazy(() =>
  import("./app/(dashboard)/observability/api-gateway/page").then((m) => ({ default: m.default }))
);
const ObservabilityComputePage = React.lazy(() =>
  import("./app/(dashboard)/observability/compute/page").then((m) => ({ default: m.default }))
);
const ObservabilityDatabasePage = React.lazy(() =>
  import("./app/(dashboard)/observability/database/page").then((m) => ({ default: m.default }))
);
const ObservabilityIdentityPage = React.lazy(() =>
  import("./app/(dashboard)/observability/identity/page").then((m) => ({ default: m.default }))
);
const ObservabilityMessagingPage = React.lazy(() =>
  import("./app/(dashboard)/observability/messaging/page").then((m) => ({ default: m.default }))
);
const ObservabilityOltPollerPage = React.lazy(() =>
  import("./app/(dashboard)/observability/olt-poller/page").then((m) => ({ default: m.default }))
);
const ObservabilitySchedulerPage = React.lazy(() =>
  import("./app/(dashboard)/observability/scheduler/page").then((m) => ({ default: m.default }))
);
const ObservabilityQueryPerfPage = React.lazy(() =>
  import("./app/(dashboard)/observability/query-performance/page").then((m) => ({ default: m.default }))
);
const ObservabilitySpatialMapPage = React.lazy(() =>
  import("./app/(dashboard)/observability/spatial-map/page").then((m) => ({ default: m.default }))
);
const GatewaysOverviewPage = React.lazy(() =>
  import("./app/(dashboard)/gateways/overview/page").then((m) => ({ default: m.default }))
);
const GatewaysNotificationPage = React.lazy(() =>
  import("./app/(dashboard)/gateways/notification/page").then((m) => ({ default: m.default }))
);
const GatewaysPaymentPage = React.lazy(() =>
  import("./app/(dashboard)/gateways/payment/page").then((m) => ({ default: m.default }))
);
const GatewaysMapPage = React.lazy(() =>
  import("./app/(dashboard)/gateways/map/page").then((m) => ({ default: m.default }))
);
const GatewaysStoragePage = React.lazy(() =>
  import("./app/(dashboard)/gateways/storage/page").then((m) => ({ default: m.default }))
);
const GatewaysWhatsappPage = React.lazy(() =>
  import("./app/(dashboard)/gateways/whatsapp/page").then((m) => ({ default: m.default }))
);
const GatewaysSchedulerPage = React.lazy(() =>
  import("./app/(dashboard)/gateways/scheduler/page").then((m) => ({ default: m.default }))
);
const GatewaysExportPage = React.lazy(() =>
  import("./app/(dashboard)/gateways/export/page").then((m) => ({ default: m.default }))
);
const GatewaysOltPage = React.lazy(() =>
  import("./app/(dashboard)/gateways/olt/page").then((m) => ({ default: m.default }))
);
const GatewaysAuditPage = React.lazy(() =>
  import("./app/(dashboard)/gateways/audit/page").then((m) => ({ default: m.default }))
);
const GatewaysPollerPage = React.lazy(() =>
  import("./app/(dashboard)/gateways/poller/page").then((m) => ({ default: m.default }))
);
const SecurityAlertsPage = React.lazy(() =>
  import("./app/(dashboard)/security/alerts/page").then((m) => ({ default: m.default }))
);
const SecurityAuditPage = React.lazy(() =>
  import("./app/(dashboard)/security/audit/page").then((m) => ({ default: m.default }))
);
const SecurityAuthPage = React.lazy(() =>
  import("./app/(dashboard)/security/auth/page").then((m) => ({ default: m.default }))
);
const SecurityCompliancePage = React.lazy(() =>
  import("./app/(dashboard)/security/compliance/page").then((m) => ({ default: m.default }))
);
const SecurityRolesPage = React.lazy(() =>
  import("./app/(dashboard)/security/roles/page").then((m) => ({ default: m.default }))
);
const SecurityPermissionsPage = React.lazy(() =>
  import("./app/(dashboard)/security/permissions/page").then((m) => ({ default: m.default }))
);
const SecurityPasswordPolicyPage = React.lazy(() =>
  import("./app/(dashboard)/security/password-policy/page").then((m) => ({ default: m.default }))
);
const LogsPage = React.lazy(() =>
  import("./app/(dashboard)/logs/page").then((m) => ({ default: m.default }))
);
const TasksPage = React.lazy(() =>
  import("./app/(dashboard)/tasks/page").then((m) => ({ default: m.default }))
);
const TasksNewPage = React.lazy(() =>
  import("./app/(dashboard)/tasks/new/page").then((m) => ({ default: m.default }))
);
const TasksIdPage = React.lazy(() =>
  import("./app/(dashboard)/tasks/[id]/page").then((m) => ({ default: m.default }))
);
const TasksProjectsPage = React.lazy(() =>
  import("./app/(dashboard)/tasks/projects/page").then((m) => ({ default: m.default }))
);
const TasksProjectIdPage = React.lazy(() =>
  import("./app/(dashboard)/tasks/projects/[id]/page").then((m) => ({ default: m.default }))
);
const AiPage = React.lazy(() =>
  import("./app/(dashboard)/ai/page").then((m) => ({ default: m.default }))
);
const AiAddPage = React.lazy(() =>
  import("./app/(dashboard)/ai/add/page").then((m) => ({ default: m.default }))
);
const AiConfigPage = React.lazy(() =>
  import("./app/(dashboard)/ai/config/page").then((m) => ({ default: m.default }))
);
const AiTemplatesPage = React.lazy(() =>
  import("./app/(dashboard)/ai/templates/page").then((m) => ({ default: m.default }))
);
const AiPromptsPage = React.lazy(() =>
  import("./app/(dashboard)/ai/prompts/page").then((m) => ({ default: m.default }))
);
const AiSimulatorPage = React.lazy(() =>
  import("./app/(dashboard)/ai/simulator/page").then((m) => ({ default: m.default }))
);
const AiGraphPage = React.lazy(() =>
  import("./app/(dashboard)/ai/graph/page").then((m) => ({ default: m.default }))
);
const SettingsGeneralPage = React.lazy(() =>
  import("./app/(dashboard)/settings/general/page").then((m) => ({ default: m.default }))
);
const SettingsBrandingPage = React.lazy(() =>
  import("./app/(dashboard)/settings/branding/page").then((m) => ({ default: m.default }))
);
const SettingsSmtpPage = React.lazy(() =>
  import("./app/(dashboard)/settings/smtp-mail/page").then((m) => ({ default: m.default }))
);
const SettingsGisSpatialPage = React.lazy(() =>
  import("./app/(dashboard)/settings/gis-spatial/page").then((m) => ({ default: m.default }))
);
const Assets3dPage = React.lazy(() =>
  import("./app/(dashboard)/assets-3d/page").then((m) => ({ default: m.default }))
);

// ----------------------------------------------------------------
// Suspense fallback
// ----------------------------------------------------------------
function PageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs font-mono text-muted-foreground">Memuat halaman...</span>
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
  component: () => (
    <ProtectedRoute requiredRoles={["super_admin", "ROLE_SUPER_ADMIN"]}>
      <AdminLayout />
    </ProtectedRoute>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/overview" />,
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/overview",
  component: () => <Lazy><SystemOverviewPage /></Lazy>,
});

// Organizations
const orgsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/organizations", component: () => <Lazy><OrganizationsPage /></Lazy> });
const orgSlugRoute = createRoute({ getParentRoute: () => rootRoute, path: "/organizations/$slug", component: () => <Lazy><OrganizationSlugPage /></Lazy> });
const orgQuotasRoute = createRoute({ getParentRoute: () => rootRoute, path: "/organizations/quotas", component: () => <Lazy><OrganizationQuotasPage /></Lazy> });
const orgFeaturesRoute = createRoute({ getParentRoute: () => rootRoute, path: "/organizations/features", component: () => <Lazy><OrganizationFeaturesPage /></Lazy> });
const orgDomainsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/organizations/domains", component: () => <Lazy><OrganizationDomainsPage /></Lazy> });
const orgVpnRoute = createRoute({ getParentRoute: () => rootRoute, path: "/organizations/vpn", component: () => <Lazy><OrganizationVpnPage /></Lazy> });

// Users
const usersRoute = createRoute({ getParentRoute: () => rootRoute, path: "/users", component: () => <Lazy><UsersPage /></Lazy> });
const usersRolesRoute = createRoute({ getParentRoute: () => rootRoute, path: "/users/roles", component: () => <Lazy><UsersRolesPage /></Lazy> });
const usersSessionsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/users/sessions", component: () => <Lazy><UsersSessionsPage /></Lazy> });

// Observability
const obsOverviewRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability/overview", component: () => <Lazy><ObservabilityOverviewPage /></Lazy> });
const obsApiGatewayRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability/api-gateway", component: () => <Lazy><ObservabilityApiGatewayPage /></Lazy> });
const obsComputeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability/compute", component: () => <Lazy><ObservabilityComputePage /></Lazy> });
const obsDatabaseRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability/database", component: () => <Lazy><ObservabilityDatabasePage /></Lazy> });
const obsIdentityRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability/identity", component: () => <Lazy><ObservabilityIdentityPage /></Lazy> });
const obsMessagingRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability/messaging", component: () => <Lazy><ObservabilityMessagingPage /></Lazy> });
const obsOltPollerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability/olt-poller", component: () => <Lazy><ObservabilityOltPollerPage /></Lazy> });
const obsSchedulerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability/scheduler", component: () => <Lazy><ObservabilitySchedulerPage /></Lazy> });
const obsQueryPerfRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability/query-performance", component: () => <Lazy><ObservabilityQueryPerfPage /></Lazy> });
const obsSpatialMapRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability/spatial-map", component: () => <Lazy><ObservabilitySpatialMapPage /></Lazy> });
const obsRedirectRoute = createRoute({ getParentRoute: () => rootRoute, path: "/observability", component: () => <Navigate to="/observability/overview" /> });

// Gateways
const gatewaysOverviewRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/overview", component: () => <Lazy><GatewaysOverviewPage /></Lazy> });
const gatewaysRedirectRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways", component: () => <Navigate to="/gateways/overview" /> });
const gatewaysNotifRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/notification", component: () => <Lazy><GatewaysNotificationPage /></Lazy> });
const gatewaysPaymentRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/payment", component: () => <Lazy><GatewaysPaymentPage /></Lazy> });
const gatewaysMapRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/map", component: () => <Lazy><GatewaysMapPage /></Lazy> });
const gatewaysStorageRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/storage", component: () => <Lazy><GatewaysStoragePage /></Lazy> });
const gatewaysWhatsappRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/whatsapp", component: () => <Lazy><GatewaysWhatsappPage /></Lazy> });
const gatewaysSchedulerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/scheduler", component: () => <Lazy><GatewaysSchedulerPage /></Lazy> });
const gatewaysExportRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/export", component: () => <Lazy><GatewaysExportPage /></Lazy> });
const gatewaysOltRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/olt", component: () => <Lazy><GatewaysOltPage /></Lazy> });
const gatewaysAuditRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/audit", component: () => <Lazy><GatewaysAuditPage /></Lazy> });
const gatewaysPollerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/gateways/poller", component: () => <Lazy><GatewaysPollerPage /></Lazy> });

// Security
const securityRoute = createRoute({ getParentRoute: () => rootRoute, path: "/security", component: () => <Navigate to="/security/alerts" /> });

const securityAlertsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/security/alerts", component: () => <Lazy><SecurityAlertsPage /></Lazy> });
const securityAuditRoute = createRoute({ getParentRoute: () => rootRoute, path: "/security/audit", component: () => <Lazy><SecurityAuditPage /></Lazy> });
const securityAuthRoute = createRoute({ getParentRoute: () => rootRoute, path: "/security/auth", component: () => <Lazy><SecurityAuthPage /></Lazy> });
const securityComplianceRoute = createRoute({ getParentRoute: () => rootRoute, path: "/security/compliance", component: () => <Lazy><SecurityCompliancePage /></Lazy> });
const securityRolesRoute = createRoute({ getParentRoute: () => rootRoute, path: "/security/roles", component: () => <Lazy><SecurityRolesPage /></Lazy> });
const securityPermissionsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/security/permissions", component: () => <Lazy><SecurityPermissionsPage /></Lazy> });
const securityPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: "/security/password-policy", component: () => <Lazy><SecurityPasswordPolicyPage /></Lazy> });

// Logs
const logsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/logs", component: () => <Lazy><LogsPage /></Lazy> });

// Tasks
const tasksRoute = createRoute({ getParentRoute: () => rootRoute, path: "/tasks", component: () => <Lazy><TasksPage /></Lazy> });
const tasksNewRoute = createRoute({ getParentRoute: () => rootRoute, path: "/tasks/new", component: () => <Lazy><TasksNewPage /></Lazy> });
const tasksIdRoute = createRoute({ getParentRoute: () => rootRoute, path: "/tasks/$id", component: () => <Lazy><TasksIdPage /></Lazy> });
const tasksProjectsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/tasks/projects", component: () => <Lazy><TasksProjectsPage /></Lazy> });
const tasksProjectIdRoute = createRoute({ getParentRoute: () => rootRoute, path: "/tasks/projects/$id", component: () => <Lazy><TasksProjectIdPage /></Lazy> });

// AI
const aiRoute = createRoute({ getParentRoute: () => rootRoute, path: "/ai", component: () => <Lazy><AiPage /></Lazy> });
const aiAddRoute = createRoute({ getParentRoute: () => rootRoute, path: "/ai/add", component: () => <Lazy><AiAddPage /></Lazy> });
const aiConfigRoute = createRoute({ getParentRoute: () => rootRoute, path: "/ai/config", component: () => <Lazy><AiConfigPage /></Lazy> });
const aiTemplatesRoute = createRoute({ getParentRoute: () => rootRoute, path: "/ai/templates", component: () => <Lazy><AiTemplatesPage /></Lazy> });
const aiPromptsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/ai/prompts", component: () => <Lazy><AiPromptsPage /></Lazy> });
const aiSimulatorRoute = createRoute({ getParentRoute: () => rootRoute, path: "/ai/simulator", component: () => <Lazy><AiSimulatorPage /></Lazy> });
const aiGraphRoute = createRoute({ getParentRoute: () => rootRoute, path: "/ai/graph", component: () => <Lazy><AiGraphPage /></Lazy> });

// Settings
const settingsRedirectRoute = createRoute({ getParentRoute: () => rootRoute, path: "/settings", component: () => <Navigate to="/settings/general" /> });
const settingsGeneralRoute = createRoute({ getParentRoute: () => rootRoute, path: "/settings/general", component: () => <Lazy><SettingsGeneralPage /></Lazy> });
const settingsBrandingRoute = createRoute({ getParentRoute: () => rootRoute, path: "/settings/branding", component: () => <Lazy><SettingsBrandingPage /></Lazy> });
const settingsSmtpRoute = createRoute({ getParentRoute: () => rootRoute, path: "/settings/smtp-mail", component: () => <Lazy><SettingsSmtpPage /></Lazy> });
const settingsGisSpatialRoute = createRoute({ getParentRoute: () => rootRoute, path: "/settings/gis-spatial", component: () => <Lazy><SettingsGisSpatialPage /></Lazy> });

// Assets 3D
const assets3dRoute = createRoute({ getParentRoute: () => rootRoute, path: "/assets-3d", component: () => <Lazy><Assets3dPage /></Lazy> });

// ----------------------------------------------------------------
// Route tree
// ----------------------------------------------------------------
const routeTree = rootRoute.addChildren([
  indexRoute,
  overviewRoute,
  // Orgs
  orgsRoute, orgSlugRoute, orgQuotasRoute, orgFeaturesRoute, orgDomainsRoute, orgVpnRoute,
  // Users
  usersRoute, usersRolesRoute, usersSessionsRoute,
  // Observability
  obsRedirectRoute, obsOverviewRoute, obsApiGatewayRoute, obsComputeRoute, obsDatabaseRoute,
  obsIdentityRoute, obsMessagingRoute, obsOltPollerRoute, obsSchedulerRoute, obsQueryPerfRoute, obsSpatialMapRoute,
  // Gateways
  gatewaysRedirectRoute, gatewaysOverviewRoute, gatewaysNotifRoute, gatewaysPaymentRoute, gatewaysMapRoute,
  gatewaysStorageRoute, gatewaysWhatsappRoute, gatewaysSchedulerRoute, gatewaysExportRoute,
  gatewaysOltRoute, gatewaysAuditRoute, gatewaysPollerRoute,
  // Security
  securityRoute, securityAlertsRoute, securityAuditRoute, securityAuthRoute,
  securityComplianceRoute, securityRolesRoute, securityPermissionsRoute, securityPasswordRoute,
  // Others
  logsRoute,
  tasksRoute, tasksNewRoute, tasksIdRoute, tasksProjectsRoute, tasksProjectIdRoute,
  aiRoute, aiAddRoute, aiConfigRoute, aiTemplatesRoute, aiPromptsRoute, aiSimulatorRoute, aiGraphRoute,
  settingsRedirectRoute, settingsGeneralRoute, settingsBrandingRoute, settingsSmtpRoute, settingsGisSpatialRoute,
  assets3dRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
