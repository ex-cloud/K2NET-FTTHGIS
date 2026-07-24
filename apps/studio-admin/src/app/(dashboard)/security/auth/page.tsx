"use client";

import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Fingerprint,
  History,
  Lock,
  Globe,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Monitor,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Label } from "@k2net/ui";
import { Switch } from "@k2net/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@k2net/ui";
import { Skeleton } from "@k2net/ui";
import { Separator } from "@k2net/ui";

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
    isUpdatingSsoProvider
  } = useSecuritySettings();

  // Local state for toggles
  const [regAllowed, setRegAllowed] = useState(false);
  const [emailVerify, setEmailVerify] = useState(false);
  const [resetAllowed, setResetAllowed] = useState(false);

  // Local state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when sessions count changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset pagination when data changes
    setCurrentPage(1);
  }, [sessions.length]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = sessions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sessions.length / itemsPerPage);

  // Local state for SSO inputs
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientSecretInput, setClientSecretInput] = useState("");

  // Sync state when data is loaded
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (realmConfig) {
      setRegAllowed(realmConfig.registrationAllowed);
      setEmailVerify(realmConfig.verifyEmail);
      setResetAllowed(realmConfig.resetPasswordAllowed);
    }
  }, [realmConfig]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      toast.success("User session terminated successfully.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke session");
    }
  };

  const isConfigChanged =
    realmConfig &&
    (regAllowed !== realmConfig.registrationAllowed ||
      emailVerify !== realmConfig.verifyEmail ||
      resetAllowed !== realmConfig.resetPasswordAllowed);

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
        
        {/* Header section */}
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
          
          {/* Card 1: Keycloak Settings */}
          <Card className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Global Realm Security
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Configure basic registration permissions and credential checks on the Keycloak master domain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Registration Allowed */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-foreground text-sm font-medium">
                    Self-Registration
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow users to create accounts without admin invitation.
                  </p>
                </div>
                <Switch
                  checked={regAllowed}
                  onCheckedChange={setRegAllowed}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <Separator className="bg-muted/60" />

              {/* Verify Email */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-foreground text-sm font-medium">
                    Email Verification
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Require email verification before granting access.
                  </p>
                </div>
                <Switch
                  checked={emailVerify}
                  onCheckedChange={setEmailVerify}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <Separator className="bg-muted/60" />

              {/* Reset Password Allowed */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-foreground text-sm font-medium">
                    Self Reset Password
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Provide a &quot;Forgot Password&quot; link on the login page.
                  </p>
                </div>
                <Switch
                  checked={resetAllowed}
                  onCheckedChange={setResetAllowed}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

            </CardContent>
            <CardFooter className="border-t border-border pt-4 flex justify-end">
              <Button
                onClick={handleSaveRealmConfig}
                disabled={isUpdatingRealmConfig || !isConfigChanged}
                variant="default"
                size="sm"
              >
                {isUpdatingRealmConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null} Save Security Policies
              </Button>
            </CardFooter>
          </Card>

          {/* Card 2: Social SSO Providers */}
          <Card className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary" /> Identity Providers (SSO)
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Activate Google, Microsoft, GitHub, or LinkedIn single sign-on buttons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              
              <div className="grid grid-cols-2 gap-4">
                {["google", "microsoft", "github", "linkedin-openid"].map((provider) => {
                  const configured = ssoProviders.find(p => p.alias === provider);
                  return (
                    <button
                      key={provider}
                      onClick={() => {
                        setSelectedProvider(provider);
                        setClientIdInput(configured?.clientId || "");
                        setClientSecretInput("");
                      }}
                      className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                        selectedProvider === provider
                          ? "border-primary bg-primary/10 text-primary"
                          : configured?.enabled
                          ? "border-border bg-card/30 text-foreground hover:border-border"
                          : "border-border/50 bg-background/20 text-muted-foreground hover:border-border"
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                      <span className="text-xs capitalize font-medium">{provider.replace("-openid", "")}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        configured?.enabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/60"
                      }`}>
                        {configured?.enabled ? "Active" : "Not Configured"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedProvider && (
                <div className="p-4 rounded-xl border border-border bg-background/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold capitalize text-primary">Configure {selectedProvider.replace("-openid", "")} SSO</h4>
                    <button onClick={() => setSelectedProvider(null)} className="text-[10px] text-muted-foreground hover:text-muted-foreground">Cancel</button>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="sso_client_id" className="text-muted-foreground text-[10px]">Client ID</Label>
                      <Input
                        id="sso_client_id"
                        value={clientIdInput}
                        onChange={(e) => setClientIdInput(e.target.value)}
                        placeholder="OAuth Client ID"
                        className="bg-muted/60 border-border text-foreground text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sso_client_secret" className="text-muted-foreground text-[10px]">Client Secret</Label>
                      <Input
                        id="sso_client_secret"
                        type="password"
                        value={clientSecretInput}
                        onChange={(e) => setClientSecretInput(e.target.value)}
                        placeholder="OAuth Client Secret"
                        className="bg-muted/60 border-border text-foreground text-xs h-8"
                      />
                    </div>
                    <Button
                      onClick={() => handleSaveSso(selectedProvider)}
                      disabled={isUpdatingSsoProvider}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 font-medium transition-all"
                    >
                      {isUpdatingSsoProvider ? "Connecting..." : "Enable Provider"}
                    </Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* Card 3: Active User Sessions */}
        <Card className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Active SSO Sessions
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Real-time active single sign-on sessions on your tenant database and OAuth gateways.
              </CardDescription>
            </div>
            <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
              {sessions.length} Active Sessions
            </span>
          </CardHeader>
          <CardContent className="pt-6">
            
            {sessions.length === 0 ? (
              <div className="p-8 text-center border border-border/60 rounded-xl bg-background/40 text-muted-foreground text-xs">
                No active SSO sessions found on this server.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-border rounded-xl bg-background/30">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-card/40 text-muted-foreground font-medium">
                        <th className="p-4">User</th>
                        <th className="p-4">Tenant / Organization</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4">Login Time</th>
                        <th className="p-4">Last Access</th>
                        <th className="p-4">Client Access</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSessions.map((session) => (
                        <tr key={session.id} className="border-b border-border/40 hover:bg-muted/10 text-muted-foreground">
                          <td className="p-4 font-medium flex items-center gap-2">
                            <Monitor className="w-3.5 h-3.5 text-muted-foreground" /> {session.username}
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] bg-muted border border-border px-2 py-0.5 rounded text-muted-foreground font-medium font-sans">
                              {session.tenant || "System/Root"}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-muted-foreground">{session.ipAddress}</td>
                          <td className="p-4">
                            {new Date(session.start).toLocaleString("id-ID", { hour12: false })}
                          </td>
                          <td className="p-4">
                            {new Date(session.lastAccess).toLocaleString("id-ID", { hour12: false })}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {session.clients.map((client) => (
                                <span key={client} className="text-[9px] bg-muted border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                  {client}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="destructive"
                              onClick={() => handleRevokeSession(session.id)}
                              disabled={isRevokingSession}
                              className="bg-rose-500/10 hover:bg-rose-500 hover:text-foreground border border-rose-500/20 text-rose-400 text-[10px] h-7 px-2.5 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Revoke
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {sessions.length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-4 px-2">
                    <span className="text-xs text-muted-foreground">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sessions.length)} of {sessions.length} sessions
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 bg-muted border-border text-muted-foreground hover:bg-muted disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground px-2 font-medium">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 bg-muted border-border text-muted-foreground hover:bg-muted disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mt-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="text-xs font-semibold text-rose-400">Security Precaution</h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Revoking an active session will immediately invalidate the user&apos;s OIDC access tokens. They will be forced to log out and authenticate again upon their next client request. Use this tool only to neutralize compromised sessions or during security incidents.
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
