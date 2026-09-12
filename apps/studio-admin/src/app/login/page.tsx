import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation-compat";
import { useAuth } from "@k2net/auth/client";
import { AuthLoginLayout, Button } from "@k2net/ui";
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
        <div className="rounded-xl border border-border/70 bg-card/60 p-8 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                K2NET Platform Admin
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
