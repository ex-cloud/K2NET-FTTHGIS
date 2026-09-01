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

  React.useEffect(() => {
    if (initialized && !authenticated && autoRedirect) {
      login();
    }
  }, [initialized, authenticated, autoRedirect, login]);

  if (!initialized || (!authenticated && autoRedirect)) {
    return (
      fallback || (
        <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-mono">
              {!initialized ? "Memverifikasi sesi keamanan..." : "Mengalihkan ke Portal Login Keycloak..."}
            </span>
          </div>
        </div>
      )
    );
  }

  if (!authenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-6">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-xl font-bold text-foreground">Otentikasi Diperlukan</h2>
          <p className="text-sm text-muted-foreground">
            Sesi login Anda tidak aktif atau telah kedaluwarsa. Silakan masuk kembali ke sistem.
          </p>
          <button
            onClick={() => login()}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 cursor-pointer"
          >
            Masuk dengan SSO
          </button>
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
