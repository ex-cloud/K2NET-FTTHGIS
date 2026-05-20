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
  KeyRound,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Monitor,
  Calendar,
  Layers,
  Network,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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
    } catch (error: any) {
      toast.error(error.message || "Failed to update Keycloak settings");
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
    } catch (error: any) {
      toast.error(error.message || "Failed to configure SSO");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      toast.success("User session terminated successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke session");
    }
  };

  const isConfigChanged =
    realmConfig &&
    (regAllowed !== realmConfig.registrationAllowed ||
      emailVerify !== realmConfig.verifyEmail ||
      resetAllowed !== realmConfig.resetPasswordAllowed);

  if (loadingRealmConfig || loadingSessions || loadingSsoProviders) {
    return (
      <div className="flex-1 flex flex-col pt-16 px-8 bg-[#0c0c0c] min-h-screen text-zinc-100 overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64 bg-zinc-800" />
            <Skeleton className="h-4 w-96 bg-zinc-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full bg-zinc-800/50 rounded-lg" />
            <Skeleton className="h-[300px] w-full bg-zinc-800/50 rounded-lg" />
          </div>
          <Skeleton className="h-[250px] w-full bg-zinc-800/50 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#0c0c0c] h-full overflow-y-auto custom-scrollbar select-none text-zinc-100">
      <div className="w-full max-w-5xl mx-auto space-y-10 pb-20">
        
        {/* Header section */}
        <div className="flex items-center justify-between border-b border-zinc-800/40 pb-6 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-500" /> Authentication Control
            </h1>
            <p className="text-xs text-zinc-400">
              Manage SSO providers, enforce global registration policies, and monitor active single sign-on user sessions dynamically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Keycloak Settings */}
          <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-zinc-800/40">
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" /> Global Realm Security
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Configure basic registration permissions and credential checks on the Keycloak master domain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Registration Allowed */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-zinc-200 text-sm font-medium">
                    Self-Registration
                  </Label>
                  <p className="text-xs text-zinc-400">
                    Allow users to create accounts without admin invitation.
                  </p>
                </div>
                <Switch
                  checked={regAllowed}
                  onCheckedChange={setRegAllowed}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              <Separator className="bg-zinc-800/60" />

              {/* Verify Email */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-zinc-200 text-sm font-medium">
                    Email Verification
                  </Label>
                  <p className="text-xs text-zinc-400">
                    Require email verification before granting access.
                  </p>
                </div>
                <Switch
                  checked={emailVerify}
                  onCheckedChange={setEmailVerify}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              <Separator className="bg-zinc-800/60" />

              {/* Reset Password Allowed */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-zinc-200 text-sm font-medium">
                    Self Reset Password
                  </Label>
                  <p className="text-xs text-zinc-400">
                    Provide a &quot;Forgot Password&quot; link on the login page.
                  </p>
                </div>
                <Switch
                  checked={resetAllowed}
                  onCheckedChange={setResetAllowed}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

            </CardContent>
            <CardFooter className="border-t border-zinc-800/40 pt-4 flex justify-end">
              <Button
                onClick={handleSaveRealmConfig}
                disabled={isUpdatingRealmConfig || !isConfigChanged}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs h-9 px-4 font-medium transition-all shadow-md gap-2"
              >
                {isUpdatingRealmConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null} Save Security Policies
              </Button>
            </CardFooter>
          </Card>

          {/* Card 2: Social SSO Providers */}
          <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-zinc-800/40">
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-500" /> Identity Providers (SSO)
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
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
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : configured?.enabled
                          ? "border-zinc-800 bg-zinc-900/30 text-zinc-100 hover:border-zinc-700"
                          : "border-zinc-800/50 bg-zinc-950/20 text-zinc-500 hover:border-zinc-800"
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                      <span className="text-xs capitalize font-medium">{provider.replace("-openid", "")}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        configured?.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-600"
                      }`}>
                        {configured?.enabled ? "Active" : "Not Configured"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedProvider && (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold capitalize text-emerald-400">Configure {selectedProvider.replace("-openid", "")} SSO</h4>
                    <button onClick={() => setSelectedProvider(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300">Cancel</button>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="sso_client_id" className="text-zinc-400 text-[10px]">Client ID</Label>
                      <Input
                        id="sso_client_id"
                        value={clientIdInput}
                        onChange={(e) => setClientIdInput(e.target.value)}
                        placeholder="OAuth Client ID"
                        className="bg-zinc-900/60 border-zinc-800 text-zinc-200 text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sso_client_secret" className="text-zinc-400 text-[10px]">Client Secret</Label>
                      <Input
                        id="sso_client_secret"
                        type="password"
                        value={clientSecretInput}
                        onChange={(e) => setClientSecretInput(e.target.value)}
                        placeholder="OAuth Client Secret"
                        className="bg-zinc-900/60 border-zinc-800 text-zinc-200 text-xs h-8"
                      />
                    </div>
                    <Button
                      onClick={() => handleSaveSso(selectedProvider)}
                      disabled={isUpdatingSsoProvider}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8 font-medium transition-all"
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
        <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
          <CardHeader className="border-b border-zinc-800/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-500" /> Active SSO Sessions
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Real-time active single sign-on sessions on your tenant database and OAuth gateways.
              </CardDescription>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
              {sessions.length} Active Sessions
            </span>
          </CardHeader>
          <CardContent className="pt-6">
            
            {sessions.length === 0 ? (
              <div className="p-8 text-center border border-zinc-800/60 rounded-xl bg-zinc-950/40 text-zinc-500 text-xs">
                No active SSO sessions found on this server.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-zinc-850 rounded-xl bg-zinc-950/30">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-400 font-medium">
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
                        <tr key={session.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/10 text-zinc-300">
                          <td className="p-4 font-medium flex items-center gap-2">
                            <Monitor className="w-3.5 h-3.5 text-zinc-500" /> {session.username}
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-medium font-sans">
                              {session.tenant || "System/Root"}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-zinc-400">{session.ipAddress}</td>
                          <td className="p-4">
                            {new Date(session.start).toLocaleString("id-ID", { hour12: false })}
                          </td>
                          <td className="p-4">
                            {new Date(session.lastAccess).toLocaleString("id-ID", { hour12: false })}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {session.clients.map((client) => (
                                <span key={client} className="text-[9px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded font-mono text-zinc-400">
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
                              className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 text-[10px] h-7 px-2.5 rounded-lg transition-all"
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
                    <span className="text-xs text-zinc-400">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sessions.length)} of {sessions.length} sessions
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-zinc-300 px-2 font-medium">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
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
                <p className="text-[11px] text-zinc-400 leading-relaxed">
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
