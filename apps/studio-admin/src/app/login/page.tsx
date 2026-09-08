import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation-compat";
import { useAuth } from "@k2net/auth/client";
import { AuthLoginLayout, AuthLoginForm, Button } from "@k2net/ui";
import { Shield, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const { authenticated, login, initialized } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const [redirectTriggered, setRedirectTriggered] = useState(false);

  useEffect(() => {
    if (initialized) {
      if (authenticated) {
        router.replace(callbackUrl);
      } else if (!redirectTriggered) {
        setRedirectTriggered(true);
        login({
          redirectUri: window.location.origin + callbackUrl,
        });
      }
    }
  }, [initialized, authenticated, router, callbackUrl, login, redirectTriggered]);

  const handleManualLogin = () => {
    login({
      redirectUri: window.location.origin + callbackUrl,
    });
  };

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
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-border/70 bg-card/60 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Platform Administrator Authentication
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Mengalihkan ke Master IAM 1-Langkah Keycloak...
              </p>
            </div>

            <div className="my-2 flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs font-mono text-muted-foreground">
                Memverifikasi sesi master...
              </span>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleManualLogin}
              className="mt-2 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer text-xs"
            >
              <span>Buka Form Login Administrator</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Fallback form */}
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
      </div>
    </AuthLoginLayout>
  );
}
