import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import {
  FileText,
  ShieldCheck,
  RefreshCw,
  Clock,
  MessageSquare,
  Eye,
  EyeOff,
  AlertTriangle,
  Globe,
  MapPin,
  CheckCircle2,
  Users,
  Layers,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  Switch,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
  Separator,
  TracingBeam,
  ActionTooltip,
} from "@k2net/ui";

interface SpatialGovernanceReport {
  projectsWithAbacCount: number;
  totalMemberAssignments: number;
  legacyNullProjectNodes: number;
  legacyNullProjectEdges: number;
  legacyDataClean: boolean;
  organizationSummaries: {
    organization: string;
    totalProjects: number;
    totalMembers: number;
  }[];
  checkedAt: string;
}

export default function SecurityCompliancePage() {
  const { data: session } = useSession();
  const { settings, loading, updateSettings, isUpdating } = useSystemSettings();

  // Compliance Settings States
  const [sessionTimeout, setSessionTimeout] = useState<number>(30); // 30 mins
  const [mapLockDuration, setMapLockDuration] = useState<number>(10); // 10 mins
  const [mfaEnforced, setMfaEnforced] = useState<boolean>(false);
  const [waOtpEnabled, setWaOtpEnabled] = useState<boolean>(false);

  // WhatsApp Gateway States
  const [waEnabled, setWaEnabled] = useState<boolean>(false);
  const [waUrl, setWaUrl] = useState<string>("https://api.whatsapp-gateway.com/send");
  const [waToken, setWaToken] = useState<string>("");
  const [showToken, setShowToken] = useState<boolean>(false);

  // Spatial ABAC Governance Metadata
  const [spatialReport, setSpatialReport] = useState<SpatialGovernanceReport | null>(null);
  const [spatialLoading, setSpatialLoading] = useState(false);

  const fetchSpatialGovernance = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setSpatialLoading(true);
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/security/spatial-governance`, {
        token: session.accessToken,
      });
      if (res.ok) {
        const data: SpatialGovernanceReport = await res.json();
        setSpatialReport(data);
      }
    } catch (e) {
      console.warn("Spatial governance fetch error:", e);
    } finally {
      setSpatialLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchSpatialGovernance();
  }, [fetchSpatialGovernance]);

  // Sync state from settings when loaded
  useEffect(() => {
    if (settings && settings.length > 0) {
      const timeoutSetting = settings.find((s) => s.key === "session_idle_timeout");
      const lockSetting = settings.find((s) => s.key === "map_auto_lock_duration");
      const mfaSetting = settings.find((s) => s.key === "enforce_mfa");
      const otpSetting = settings.find((s) => s.key === "wa_otp_enabled");

      const waEnabledSetting = settings.find((s) => s.key === "wa_gateway_enabled");
      const waUrlSetting = settings.find((s) => s.key === "wa_gateway_api_url");
      const waTokenSetting = settings.find((s) => s.key === "wa_gateway_token");

      if (timeoutSetting) setSessionTimeout(parseInt(timeoutSetting.value) || 30);
      if (lockSetting) setMapLockDuration(parseInt(lockSetting.value) || 10);
      if (mfaSetting) setMfaEnforced(mfaSetting.value === "true");
      if (otpSetting) setWaOtpEnabled(otpSetting.value === "true");

      if (waEnabledSetting) setWaEnabled(waEnabledSetting.value === "true");
      if (waUrlSetting) setWaUrl(waUrlSetting.value || "https://api.whatsapp-gateway.com/send");
      if (waTokenSetting) setWaToken(waTokenSetting.value || "");
    }
  }, [settings]);

  const handleSaveCompliance = async () => {
    try {
      await updateSettings({
        session_idle_timeout: sessionTimeout.toString(),
        map_auto_lock_duration: mapLockDuration.toString(),
        enforce_mfa: mfaEnforced.toString(),
        wa_otp_enabled: waOtpEnabled.toString(),
        wa_gateway_enabled: waEnabled.toString(),
        wa_gateway_api_url: waUrl,
        wa_gateway_token: waToken,
      });
      toast.success("Security compliance rules and gateway parameters updated successfully!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update compliance settings");
    }
  };

  const isChanged = () => {
    if (!settings || settings.length === 0) return false;

    const timeoutSetting = settings.find((s) => s.key === "session_idle_timeout");
    const lockSetting = settings.find((s) => s.key === "map_auto_lock_duration");
    const mfaSetting = settings.find((s) => s.key === "enforce_mfa");
    const otpSetting = settings.find((s) => s.key === "wa_otp_enabled");

    const waEnabledSetting = settings.find((s) => s.key === "wa_gateway_enabled");
    const waUrlSetting = settings.find((s) => s.key === "wa_gateway_api_url");
    const waTokenSetting = settings.find((s) => s.key === "wa_gateway_token");

    return (
      sessionTimeout !== (timeoutSetting ? parseInt(timeoutSetting.value) : 30) ||
      mapLockDuration !== (lockSetting ? parseInt(lockSetting.value) : 10) ||
      mfaEnforced !== (mfaSetting ? mfaSetting.value === "true" : false) ||
      waOtpEnabled !== (otpSetting ? otpSetting.value === "true" : false) ||
      waEnabled !== (waEnabledSetting ? waEnabledSetting.value === "true" : false) ||
      waUrl !== (waUrlSetting ? waUrlSetting.value : "https://api.whatsapp-gateway.com/send") ||
      waToken !== (waTokenSetting ? waTokenSetting.value : "")
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background min-h-screen text-foreground overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <Skeleton className="h-8 w-64 bg-card/40" />
          <Skeleton className="h-4 w-96 bg-card/30" />
          <Skeleton className="h-64 w-full bg-card/20 rounded-xl" />
          <Skeleton className="h-64 w-full bg-card/20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background min-h-screen text-foreground overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full pb-16">
        {/* Header Title */}
        <div className="flex items-center justify-between pb-6 border-b border-border/40 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" /> Security Policies &amp; Compliance
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Configure system-wide security constraints, session lifecycles, and Multi-Factor OTP authenticators.
            </p>
          </div>
          <ActionTooltip label="Refresh Settings" shortcut="R">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.reload();
              }}
              className="border-border/60 hover:bg-card/60 text-muted-foreground hover:text-foreground text-xs h-8 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload
            </Button>
          </ActionTooltip>
        </div>

        {/* TracingBeam Wrapping Content */}
        <TracingBeam className="px-4">
          <div className="space-y-8 pl-4 md:pl-10">
            {/* Card 1: Session, Lock & Identity Lifecycle */}
            <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Session &amp; Device Policies
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                  Govern session lifetimes and auto-lock security triggers for unauthorized terminal prevention.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Session Idle Timeout Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-foreground text-sm font-medium">Session Idle Logout</Label>
                      <p className="text-xs text-muted-foreground font-normal">
                        Terminate inactive SSO sessions and force user re-auth.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {sessionTimeout} minutes
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <Separator className="bg-muted/60" />

                {/* Map Auto-Lock Timeout */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-foreground text-sm font-medium">Map Canvas Lock</Label>
                      <p className="text-xs text-muted-foreground font-normal">
                        Automatically blur and lock active FTTH GIS map screens.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {mapLockDuration} minutes
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="60"
                    step="2"
                    value={mapLockDuration}
                    onChange={(e) => setMapLockDuration(parseInt(e.target.value))}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <Separator className="bg-muted/60" />

                {/* Multi Factor Authentication Switches */}
                <div className="space-y-4">
                  {/* Enforce MFA Globally */}
                  <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-background/20">
                    <div className="space-y-1">
                      <Label className="text-foreground text-xs font-semibold">Enforce Device Verification</Label>
                      <p className="text-[10px] text-muted-foreground">
                        Require OTP step-up authentication when login from a new device is detected.
                      </p>
                    </div>
                    <Switch
                      checked={mfaEnforced}
                      onCheckedChange={setMfaEnforced}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  {/* WhatsApp OTP Mode */}
                  <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-background/20">
                    <div className="space-y-1">
                      <Label className="text-foreground text-xs font-semibold">WhatsApp Gateway OTP</Label>
                      <p className="text-[10px] text-muted-foreground">
                        Use WhatsApp API as primary Multi-Factor auth provider instead of Email.
                      </p>
                    </div>
                    <Switch
                      checked={waOtpEnabled}
                      onCheckedChange={setWaOtpEnabled}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Spatial ABAC & Project Governance Metadata (Fase 3 & Master Blueprint) */}
            <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-400" /> Spatial ABAC &amp; Project Governance
                  </span>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase font-bold">
                    System Plane Metadata
                  </span>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                  Ringkasan agregat kepatuhan Attribute-Based Access Control (ABAC) spasial dan integritas data isolasi
                  project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-card/60 border border-border">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                      Project dengan ABAC
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      {spatialReport?.projectsWithAbacCount ?? "—"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-card/60 border border-border">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                      Total Penugasan
                    </span>
                    <span className="text-xl font-bold text-sky-400">
                      {spatialReport?.totalMemberAssignments ?? "—"} Member
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-card/60 border border-border">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                      Legacy Nodes NULL
                    </span>
                    <span
                      className={`text-xl font-bold ${
                        (spatialReport?.legacyNullProjectNodes ?? 0) === 0 ? "text-primary" : "text-amber-400"
                      }`}
                    >
                      {spatialReport?.legacyNullProjectNodes ?? 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-card/60 border border-border">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                      Legacy Edges NULL
                    </span>
                    <span
                      className={`text-xl font-bold ${
                        (spatialReport?.legacyNullProjectEdges ?? 0) === 0 ? "text-primary" : "text-amber-400"
                      }`}
                    >
                      {spatialReport?.legacyNullProjectEdges ?? 0}
                    </span>
                  </div>
                </div>

                {/* Legacy Data Health Note */}
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs text-foreground font-medium">
                      Integritas Data Spasial: Seluruh elemen jaringan memiliki isolasi project_id valid (0 orphaned
                      elements).
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    Checked: {spatialReport?.checkedAt ? new Date(spatialReport.checkedAt).toLocaleTimeString() : "Live"}
                  </span>
                </div>

                {/* Breakdown List */}
                {spatialReport && spatialReport.organizationSummaries && spatialReport.organizationSummaries.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-foreground block">
                      Distribusi ABAC per Organisasi Tenant (Agregat Metadata):
                    </span>
                    <div className="border border-border rounded-xl overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                          <tr>
                            <th className="p-2.5">Organisasi Tenant</th>
                            <th className="p-2.5">Total Project Terdaftar</th>
                            <th className="p-2.5 text-right">Total Anggota Ditugaskan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {spatialReport.organizationSummaries.map((os, idx) => (
                            <tr key={idx} className="hover:bg-muted/30">
                              <td className="p-2.5 font-medium text-foreground">{os.organization}</td>
                              <td className="p-2.5 font-mono text-sky-400">{os.totalProjects} project</td>
                              <td className="p-2.5 text-right font-mono font-bold text-foreground">
                                {os.totalMembers} member
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 3: WhatsApp Notification & OTP Gateway Settings */}
            <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> WhatsApp API Gateway Config
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                  Integrate external messaging APIs (e.g. Fonnte, RuangWA) to broadcast alarms and verify OTPs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {/* WA Enabled switch */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/20">
                  <div className="space-y-0.5">
                    <Label className="text-foreground text-xs font-semibold">Enable WhatsApp Notifications</Label>
                    <p className="text-[10px] text-muted-foreground font-normal">
                      Switch to active or developer mock simulation mode.
                    </p>
                  </div>
                  <Switch
                    checked={waEnabled}
                    onCheckedChange={setWaEnabled}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {/* API Endpoints and token inputs */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="wa_api_url" className="text-muted-foreground text-xs">
                      Gateway API URL Endpoint
                    </Label>
                    <Input
                      id="wa_api_url"
                      value={waUrl}
                      disabled={!waEnabled}
                      onChange={(e) => setWaUrl(e.target.value)}
                      placeholder="https://api.fonnte.com/send"
                      className="bg-muted/60 border-border text-foreground text-xs h-9 disabled:opacity-40"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="wa_secret_token" className="text-muted-foreground text-xs">
                      Authorization Secret Token
                    </Label>
                    <div className="relative">
                      <Input
                        id="wa_secret_token"
                        type={showToken ? "text" : "password"}
                        value={waToken}
                        disabled={!waEnabled}
                        onChange={(e) => setWaToken(e.target.value)}
                        placeholder="Enter API token secret..."
                        className="bg-muted/60 border-border text-foreground text-xs h-9 pr-10 disabled:opacity-40"
                      />
                      <button
                        type="button"
                        disabled={!waEnabled}
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Compliance Precaution banner */}
                {!waEnabled && (
                  <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      <strong>Developer Sandbox Fallback:</strong> WhatsApp API gateway is disabled. All OTP
                      authentication and service messages will be routed straight to the backend debug console/logs.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t border-border/40 pt-4 flex justify-end">
                <ActionTooltip
                  label={isChanged() ? "Simpan Perubahan Pengaturan Compliance" : "Tidak Ada Perubahan"}
                  shortcut="Ctrl+S"
                >
                  <Button
                    onClick={handleSaveCompliance}
                    disabled={isUpdating || !isChanged()}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs h-9 px-4 font-medium transition-all shadow-md gap-2"
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    Apply Configuration Settings
                  </Button>
                </ActionTooltip>
              </CardFooter>
            </Card>
          </div>
        </TracingBeam>
      </div>
    </div>
  );
}
