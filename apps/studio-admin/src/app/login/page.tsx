import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation-compat";
import { useAuth } from "@k2net/auth/client";
import { AuthLoginLayout, AuthLoginForm } from "@k2net/ui";

export default function AdminLoginPage() {
  const { authenticated, login, initialized } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  useEffect(() => {
    if (initialized && authenticated) {
      router.replace(callbackUrl);
    }
  }, [initialized, authenticated, router, callbackUrl]);

  const handleContinueWithEmail = (email: string) => {
    login({
      loginHint: email,
      redirectUri: window.location.origin + callbackUrl,
    });
  };

  const handleContinueWithProvider = (providerId: string) => {
    login({
      idpHint: providerId,
      redirectUri: window.location.origin + callbackUrl,
    });
  };

  return (
    <AuthLoginLayout
      portalName="FTTH GIS PORTAL"
      portalSubtitle="Sign in to your system administrator account."
      docsUrl="https://system-gis.kdua.net/gateways/overview"
      testimonialQuote="Managing enterprise fiber-to-the-home geodata networks has never been this seamless. Highly stable, fast geocoding, and fully isolated multi-tenancy."
      testimonialAuthor="Andiansyah"
      testimonialRole="Chief Technology Officer, K2NET"
    >
      <AuthLoginForm
        orgName="K2NET Platform Admin"
        title="System Administration"
        description="Master IAM & Platform Operations"
        plan="INTERNAL"
        planDisplayName="System Admin"
        authMode="KEYCLOAK_SSO_MFA"
        submitLabel="Continue with Keycloak SSO"
        onContinueWithEmail={handleContinueWithEmail}
        onContinueWithProvider={handleContinueWithProvider}
        isLoading={!initialized}
      />
    </AuthLoginLayout>
  );
}
