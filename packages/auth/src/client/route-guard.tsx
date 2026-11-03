import React from "react";
import { useAuth } from "./keycloak-provider";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  unauthorizedFallback?: React.ReactNode;
  sessionExpiredFallback?: React.ReactNode;
  autoRedirect?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  fallback,
  unauthorizedFallback,
  sessionExpiredFallback,
  autoRedirect = true,
}: ProtectedRouteProps) {
  const {
    initialized,
    authenticated,
    sessionTerminated,
    loginPath,
    clearSessionTerminated,
    hasAnyRole,
  } = useAuth();

  // Allow bypass during active Super Admin impersonation exchange or session-ended modal
  const isImpersonating =
    typeof window !== "undefined" &&
    (window.location.search.includes("impersonate_code=") ||
      Boolean(sessionStorage.getItem("k2net_impersonation_meta")) ||
      Boolean(sessionStorage.getItem("k2net_impersonating_in_progress")) ||
      Boolean(sessionStorage.getItem("k2net_session_ended")));

  const targetLoginUrl = React.useMemo(() => {
    if (typeof window === "undefined") return loginPath;
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath && currentPath !== "/" && !currentPath.startsWith(loginPath)) {
      return `${loginPath}?callbackUrl=${encodeURIComponent(currentPath)}`;
    }
    return loginPath;
  }, [loginPath]);

  React.useEffect(() => {
    if (isImpersonating) return;

    if (
      initialized &&
      !authenticated &&
      !sessionTerminated &&
      autoRedirect &&
      typeof window !== "undefined"
    ) {
      if (window.location.pathname !== loginPath) {
        window.location.replace(targetLoginUrl);
      }
    }
  }, [initialized, authenticated, sessionTerminated, autoRedirect, isImpersonating, loginPath, targetLoginUrl]);

  if (isImpersonating) {
    return <>{children}</>;
  }

  if (!initialized) {
    return (
      fallback || (
        <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  if (!authenticated) {
    if (sessionTerminated) {
      if (sessionExpiredFallback) {
        return <>{sessionExpiredFallback}</>;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
          <div className="relative z-10 max-w-md w-full text-center space-y-6 backdrop-blur-md bg-card/40 border border-border/80 p-8 rounded-2xl shadow-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted border border-border text-[11px] font-mono text-muted-foreground">
                Kode Status: 419
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-destructive">419</h1>
              <h2 className="text-xl font-bold tracking-tight text-foreground/90">
                Halaman Kedaluwarsa
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Akun Anda telah terdeteksi melakukan login di perangkat atau browser lain. Sesi di perangkat ini demi keamanan otomatis dihentikan.
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  clearSessionTerminated();
                  if (typeof window !== "undefined") {
                    window.location.replace(targetLoginUrl);
                  }
                }}
                className="inline-flex h-7 w-full items-center justify-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 cursor-pointer"
              >
                Masuk Kembali
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (autoRedirect) {
      return null;
    }

    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-6">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-xl font-bold text-foreground">401</h2>
          <p className="text-sm text-muted-foreground">
            Your session is inactive or has expired. Please sign in to continue.
          </p>
          <a
            href={targetLoginUrl}
            className="inline-flex h-7 items-center justify-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 cursor-pointer"
          >
            Sign In
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
            <h2 className="text-xl font-bold text-destructive">403</h2>
            <p className="text-sm text-muted-foreground">
              Your account does not have the required permissions to open this workspace.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
