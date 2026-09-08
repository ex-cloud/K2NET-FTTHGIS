import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@k2net/auth/client";
import { AuthLoginLayout, AuthLoginForm } from "@k2net/ui";
import { extractTenantSlug } from "../../lib/keycloak-config";

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
      // Bersihkan residual legacy localStorage jika ada
      localStorage.removeItem("k2net_impersonation_meta");
      localStorage.removeItem("k2net_impersonation_token");
      localStorage.removeItem("k2net_impersonation_session_id");
      localStorage.removeItem("k2net_impersonating_in_progress");
    }
    if (initialized && authenticated) {
      navigate({ to: "/" });
    }
  }, [initialized, authenticated, navigate]);

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
      <AuthLoginForm
        title="Sign in to your ISP Workspace"
        description="Access fiber routes, optical distribution points, and subscriber telemetry."
        orgName={authConfig?.name}
        plan={authConfig?.plan}
        planDisplayName={authConfig?.planDisplayName}
        authMode={authConfig?.authMode}
        status={authConfig?.status}
        logoUrl={authConfig?.logoUrl}
        allowedMethods={authConfig?.allowedMethods || []}
        onContinueWithEmail={handleContinueWithEmail}
        onContinueWithProvider={handleContinueWithProvider}
        isLoading={!initialized || isFetchingMethods}
      />
    </AuthLoginLayout>
  );
}
