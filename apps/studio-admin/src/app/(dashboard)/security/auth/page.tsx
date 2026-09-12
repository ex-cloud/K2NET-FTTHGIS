import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Skeleton } from "@k2net/ui";
import { AuthRealmSettingsCard } from "@/components/security/auth-realm-settings-card";
import { AuthSsoProvidersCard } from "@/components/security/auth-sso-providers-card";
import { AuthActiveSessionsCard } from "@/components/security/auth-active-sessions-card";

export default function SystemAuthPage() {
  const {
    realmConfig,
    loadingRealmConfig,
    updateRealmConfig,
    isUpdatingRealmConfig,

    sessions,
    loadingSessions,
    revokeSession,
    isRevokingSession,

    ssoProviders,
    loadingSsoProviders,
    updateSsoProvider,
    isUpdatingSsoProvider,
  } = useSecuritySettings();

  const [regAllowed, setRegAllowed] = useState(false);
  const [emailVerify, setEmailVerify] = useState(false);
  const [resetAllowed, setResetAllowed] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientSecretInput, setClientSecretInput] = useState("");

  useEffect(() => {
    if (realmConfig) {
      setRegAllowed(realmConfig.registrationAllowed);
      setEmailVerify(realmConfig.verifyEmail);
      setResetAllowed(realmConfig.resetPasswordAllowed);
    }
  }, [realmConfig]);

  const handleSaveRealmConfig = async () => {
    try {
      await updateRealmConfig({
        registrationAllowed: regAllowed,
        verifyEmail: emailVerify,
        resetPasswordAllowed: resetAllowed,
      });
      toast.success("MFA & Keycloak configurations saved successfully!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update Keycloak settings");
    }
  };

  const handleSaveSso = async (providerId: string) => {
    if (!clientIdInput) {
      toast.error("Client ID is required.");
      return;
    }
    try {
      await updateSsoProvider({
        providerId,
        clientId: clientIdInput,
        clientSecret: clientSecretInput,
      });
      toast.success(`SSO integration for ${providerId} updated successfully!`);
      setSelectedProvider(null);
      setClientIdInput("");
      setClientSecretInput("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to configure SSO");
    }
  };

  const isConfigChanged =
    Boolean(realmConfig &&
    (regAllowed !== realmConfig.registrationAllowed ||
      emailVerify !== realmConfig.verifyEmail ||
      resetAllowed !== realmConfig.resetPasswordAllowed));

  if (loadingRealmConfig || loadingSessions || loadingSsoProviders) {
    return (
      <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background min-h-screen text-foreground overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64 bg-muted" />
            <Skeleton className="h-4 w-96 bg-muted" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full bg-muted/50 rounded-lg" />
            <Skeleton className="h-[300px] w-full bg-muted/50 rounded-lg" />
          </div>
          <Skeleton className="h-[250px] w-full bg-muted/50 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto custom-scrollbar select-none text-foreground">
      <div className="w-full max-w-5xl mx-auto space-y-10 pb-20">
        <div className="flex items-center justify-between border-b border-border/40 pb-6 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" /> Authentication Control
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage SSO providers, enforce global registration policies, and monitor active single sign-on user sessions dynamically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AuthRealmSettingsCard
            regAllowed={regAllowed}
            setRegAllowed={setRegAllowed}
            emailVerify={emailVerify}
            setEmailVerify={setEmailVerify}
            resetAllowed={resetAllowed}
            setResetAllowed={setResetAllowed}
            handleSaveRealmConfig={handleSaveRealmConfig}
            isUpdatingRealmConfig={isUpdatingRealmConfig}
            isConfigChanged={isConfigChanged}
          />

          <AuthSsoProvidersCard
            ssoProviders={ssoProviders}
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
            clientIdInput={clientIdInput}
            setClientIdInput={setClientIdInput}
            clientSecretInput={clientSecretInput}
            setClientSecretInput={setClientSecretInput}
            handleSaveSso={handleSaveSso}
            isUpdatingSsoProvider={isUpdatingSsoProvider}
          />
        </div>

        <AuthActiveSessionsCard
          sessions={sessions}
          revokeSession={revokeSession}
          isRevokingSession={isRevokingSession}
        />
      </div>
    </div>
  );
}
