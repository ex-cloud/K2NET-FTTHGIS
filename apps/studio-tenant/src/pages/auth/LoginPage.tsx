import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@k2net/auth/client";
import { AuthLoginLayout, AuthLoginForm, Button } from "@k2net/ui";
import { extractTenantSlug } from "../../lib/keycloak-config";
import { Shield, ArrowRight } from "lucide-react";

interface AuthMethod {
  id: string;
  name: string;
  type: string;
  icon: string;
  enabled: boolean;
}

interface OrganizationAuthMethodsResponse {
  slug: string;
  name: string;
  logoUrl?: string;
  plan?: string;
  planDisplayName?: string;
  authMode?: string;
  primaryAuthMethod: string;
  allowedMethods: AuthMethod[];
  mfaRequired: boolean;
  status?: string;
  theme: string;
}

export function LoginPage() {
  const { authenticated, login, initialized } = useAuth();
  const navigate = useNavigate();
  const tenantSlug = extractTenantSlug();
  const [redirectTriggered, setRedirectTriggered] = React.useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("impersonate_code");
      if (code) {
        navigate({ to: "/", search: { impersonate_code: code } });
        return;
      }
      if (sessionStorage.getItem("k2net_impersonation_meta")) {
        navigate({ to: "/" });
        return;
      }
      // Clean residual legacy storage
      localStorage.removeItem("k2net_impersonation_meta");
      localStorage.removeItem("k2net_impersonation_token");
      localStorage.removeItem("k2net_impersonation_session_id");
      localStorage.removeItem("k2net_impersonating_in_progress");
    }

    if (initialized) {
      if (authenticated) {
        navigate({ to: "/" });
      } else if (!redirectTriggered) {
        setRedirectTriggered(true);
        login({
          redirectUri: window.location.origin,
        });
      }
    }
  }, [initialized, authenticated, navigate, login, redirectTriggered]);

  const { data: authConfig, isLoading: isFetchingMethods } = useQuery<OrganizationAuthMethodsResponse>({
    queryKey: ["auth-methods", tenantSlug],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/v1/organizations/${tenantSlug}/auth-methods`);
        if (!res.ok) {
          return {
            slug: tenantSlug,
            name: "ISP Tenant Workspace",
            plan: "FREE",
            planDisplayName: "Starter Trial",
            authMode: "EMAIL_PASSWORD",
            primaryAuthMethod: "email-password",
            allowedMethods: [],
            mfaRequired: false,
            status: "ACTIVE",
            theme: "ftth-gis",
          };
        }
        return res.json();
      } catch {
        return {
          slug: tenantSlug,
          name: "ISP Tenant Workspace",
          plan: "FREE",
          planDisplayName: "Starter Trial",
          authMode: "EMAIL_PASSWORD",
          primaryAuthMethod: "email-password",
          allowedMethods: [],
          mfaRequired: false,
          status: "ACTIVE",
          theme: "ftth-gis",
        };
      }
    },
  });

  const handleManualLogin = () => {
    login({
      redirectUri: window.location.origin,
    });
  };

  const handleContinueWithEmail = (email: string) => {
    login({
      loginHint: email,
      redirectUri: window.location.origin,
    });
  };

  const handleContinueWithProvider = (providerId: string) => {
    login({
      idpHint: providerId,
      redirectUri: window.location.origin,
    });
  };

  return (
    <AuthLoginLayout
      portalName={authConfig?.name || "FTTH GIS Tenant Portal"}
      portalSubtitle={
        authConfig?.planDisplayName
          ? `Workspace ${authConfig.name || "Tenant"} • ${authConfig.planDisplayName}`
          : "ISP FTTH Geospatial Network Management Workspace"
      }
      docsUrl="https://system-gis.kdua.net/gateways/overview"
      testimonialQuote="From fiber distribution to optical power level diagnostics, managing our ISP footprint has never been easier."
      testimonialAuthor="ISP Operations Lead"
      testimonialRole="Network Infrastructure Team"
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-border/70 bg-card/60 p-8 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {authConfig?.name || "ISP Workspace"} Authentication
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Mengalihkan ke Keycloak 1-Step Authentication...
              </p>
            </div>

            <div className="my-2 flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs font-mono text-muted-foreground">
                Memverifikasi sesi keamanan...
              </span>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleManualLogin}
              className="mt-2 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer text-xs"
            >
              <span>Lanjutkan ke Form Login Keycloak</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </AuthLoginLayout>
  );
}
