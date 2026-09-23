import { createRootRoute, createRoute, createRouter, Navigate, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@k2net/auth/client";
import { TenantLayout } from "./layouts/TenantLayout";
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
const DashboardPage = lazyWithRetry(() =>
  import("./pages/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const MapPage = lazyWithRetry(() =>
  import("./pages/map/MapPage").then((m) => ({ default: m.MapPage }))
);
const CustomersPage = lazyWithRetry(() =>
  import("./pages/customers/CustomersPage").then((m) => ({ default: m.CustomersPage }))
);
const InventoryPage = lazyWithRetry(() =>
  import("./pages/inventory/InventoryPage").then((m) => ({ default: m.InventoryPage }))
);
const IssuesPage = lazyWithRetry(() =>
  import("./pages/issues/IssuesPage").then((m) => ({ default: m.IssuesPage }))
);
const WorkspaceDomainSettings = lazyWithRetry(() =>
  import("./pages/settings/WorkspaceDomainSettings").then((m) => ({ default: m.WorkspaceDomainSettings }))
);
const LoginPage = lazyWithRetry(() =>
  import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
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
      <div className="rounded-2xl border border-border bg-card/60 p-8 shadow-lg backdrop-blur-sm max-w-md w-full space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <span className="font-mono font-bold text-lg">404</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground">
          Rute yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Kembali ke Dashboard
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
  component: () => (
    <Lazy>
      <LoginPage />
    </Lazy>
  ),
  errorComponent: RouterErrorComponent,
});

const authenticatedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "tenant-authenticated",
  component: () => (
    <ProtectedRoute>
      <TenantLayout />
    </ProtectedRoute>
  ),
  errorComponent: RouterErrorComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/",
  component: () => (
    <Lazy>
      <DashboardPage />
    </Lazy>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/dashboard",
  component: () => <Navigate to="/" />,
});

const mapRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/map",
  component: () => (
    <Lazy>
      <MapPage />
    </Lazy>
  ),
});

const customersRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/customers",
  component: () => (
    <Lazy>
      <CustomersPage />
    </Lazy>
  ),
});

const inventoryRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/inventory",
  component: () => (
    <Lazy>
      <InventoryPage />
    </Lazy>
  ),
});

const issuesRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/issues",
  component: () => (
    <Lazy>
      <IssuesPage />
    </Lazy>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/settings",
  component: () => (
    <Lazy>
      <WorkspaceDomainSettings />
    </Lazy>
  ),
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

