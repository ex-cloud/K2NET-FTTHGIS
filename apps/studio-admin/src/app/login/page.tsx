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
      portalName="K2NET Master Console"
      portalSubtitle="Master Management & DevOps Engine"
      testimonialQuote="Unified multi-tenant observability and zero-trust mesh isolation give our operations team total visibility with zero downtime."
      testimonialAuthor="Andiansyah"
      testimonialRole="Chief Technology Officer, K2NET"
    >
      <AuthLoginForm
        title="Admin Sign In"
        description="Sign in with your master administrator credentials to access the management portal."
        allowedMethods={[
          {
            id: "google",
            name: "Google Workspace SSO",
            type: "social",
            icon: "google",
            enabled: true,
          },
        ]}
        onContinueWithEmail={handleContinueWithEmail}
        onContinueWithProvider={handleContinueWithProvider}
        isLoading={!initialized}
      />
    </AuthLoginLayout>
  );
}
