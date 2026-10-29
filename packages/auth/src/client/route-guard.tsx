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
  const { initialized, authenticated, hasAnyRole } = useAuth();

  // Allow bypass during active Super Admin impersonation exchange or session-ended modal
  const isImpersonating =
    typeof window !== "undefined" &&
    (window.location.search.includes("impersonate_code=") ||
      Boolean(sessionStorage.getItem("k2net_impersonation_meta")) ||
      Boolean(sessionStorage.getItem("k2net_impersonating_in_progress")) ||
      Boolean(sessionStorage.getItem("k2net_session_ended")));

  React.useEffect(() => {
    if (isImpersonating) return;

    if (initialized && !authenticated && autoRedirect && typeof window !== "undefined") {
      if (window.location.pathname !== "/login") {
        const currentPath = window.location.pathname + window.location.search;
        const target =
          currentPath && currentPath !== "/"
            ? `/login?callbackUrl=${encodeURIComponent(currentPath)}`
            : "/login";
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
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  if (!authenticated) {
    if (autoRedirect) {
      return null;
    }

    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-6">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-xl font-bold text-foreground">Authentication Required</h2>
          <p className="text-sm text-muted-foreground">
            Your session is inactive or has expired. Please sign in to continue.
          </p>
          <a
            href="/login"
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 cursor-pointer"
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
            <h2 className="text-xl font-bold text-destructive">Access Denied (403)</h2>
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
