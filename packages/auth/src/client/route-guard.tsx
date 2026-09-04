import React from "react";
import { useAuth } from "./keycloak-provider";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  unauthorizedFallback?: React.ReactNode;
  autoRedirect?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  fallback,
  unauthorizedFallback,
  autoRedirect = true,
}: ProtectedRouteProps) {
  const { initialized, authenticated, hasAnyRole, login } = useAuth();

  // Izinkan bypass jika sedang dalam flow impersonasi (ada query impersonate_code atau token di sessionStorage)
  const isImpersonating = typeof window !== "undefined" && (
    window.location.search.includes("impersonate_code=") ||
    !!sessionStorage.getItem("k2net_impersonation_meta") ||
    !!sessionStorage.getItem("k2net_impersonating_in_progress")
  );

  React.useEffect(() => {
    if (isImpersonating) return;

    if (initialized && !authenticated && autoRedirect) {
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        const currentPath = window.location.pathname + window.location.search;
        const target = currentPath === "/" ? "/login" : `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
        window.location.replace(target);
      }
    }
  }, [initialized, authenticated, autoRedirect, isImpersonating]);

  if (isImpersonating) {
    return <>{children}</>;
  }

  if (!initialized) {
    return (
      fallback || (
        <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-mono">
              Memverifikasi sesi keamanan...
            </span>
          </div>
        </div>
      )
    );
  }

  if (!authenticated) {
    if (autoRedirect) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-mono">
              Mengalihkan ke Portal Login...
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-6">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-xl font-bold text-foreground">Otentikasi Diperlukan</h2>
          <p className="text-sm text-muted-foreground">
            Sesi login Anda tidak aktif atau telah kedaluwarsa. Silakan masuk kembali ke sistem.
          </p>
          <a
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 cursor-pointer"
          >
            Masuk ke Portal
          </a>
        </div>
      </div>
    );
  }

  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      unauthorizedFallback || (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-6">
          <div className="max-w-md space-y-4 text-center">
            <h2 className="text-xl font-bold text-destructive">Akses Ditolak (403)</h2>
            <p className="text-sm text-muted-foreground">
              Akun Anda tidak memiliki hak akses yang diperlukan untuk membuka modul ini.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
