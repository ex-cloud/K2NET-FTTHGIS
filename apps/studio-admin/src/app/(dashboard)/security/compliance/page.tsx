import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { FileText, RefreshCw } from "lucide-react";
import { Button, Skeleton, TracingBeam, ActionTooltip } from "@k2net/ui";
import { ComplianceSessionPoliciesCard } from "@/components/security/compliance-session-policies-card";
import {
  ComplianceSpatialGovernanceCard,
  type SpatialGovernanceReport,
} from "@/components/security/compliance-spatial-governance-card";
import { ComplianceWhatsappGatewayCard } from "@/components/security/compliance-whatsapp-gateway-card";

export default function SecurityCompliancePage() {
  const { data: session } = useSession();
  const { settings, loading, updateSettings, isUpdating } = useSystemSettings();

  // Compliance Settings States
  const [sessionTimeout, setSessionTimeout] = useState<number>(30);
  const [mapLockDuration, setMapLockDuration] = useState<number>(10);
  const [mfaEnforced, setMfaEnforced] = useState<boolean>(false);
  const [waOtpEnabled, setWaOtpEnabled] = useState<boolean>(false);

  // WhatsApp Gateway States
  const [waEnabled, setWaEnabled] = useState<boolean>(false);
  const [waUrl, setWaUrl] = useState<string>("https://api.whatsapp-gateway.com/send");
  const [waToken, setWaToken] = useState<string>("");

  // Spatial ABAC Governance Metadata
  const [spatialReport, setSpatialReport] = useState<SpatialGovernanceReport | null>(null);

  const fetchSpatialGovernance = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
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
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchSpatialGovernance();
  }, [fetchSpatialGovernance]);

  // Sync state from settings when loaded
  useEffect(() => {
    if (settings && settings.length > 0) {
      const getVal = (key: string) => settings.find((s) => s.key === key)?.value;

      setSessionTimeout(parseInt(getVal("session_idle_timeout") || "30") || 30);
      setMapLockDuration(parseInt(getVal("map_auto_lock_duration") || "10") || 10);
      setMfaEnforced(getVal("enforce_mfa") === "true");
      setWaOtpEnabled(getVal("wa_otp_enabled") === "true");
      setWaEnabled(getVal("wa_gateway_enabled") === "true");
      setWaUrl(getVal("wa_gateway_api_url") || "https://api.whatsapp-gateway.com/send");
      setWaToken(getVal("wa_gateway_token") || "");
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

  const isChanged = useMemo(() => {
    if (!settings || settings.length === 0) return false;
    const getVal = (key: string) => settings.find((s) => s.key === key)?.value;

    const origTimeout = parseInt(getVal("session_idle_timeout") || "30") || 30;
    const origLock = parseInt(getVal("map_auto_lock_duration") || "10") || 10;
    const origMfa = getVal("enforce_mfa") === "true";
    const origOtp = getVal("wa_otp_enabled") === "true";
    const origWaEnabled = getVal("wa_gateway_enabled") === "true";
    const origWaUrl = getVal("wa_gateway_api_url") || "https://api.whatsapp-gateway.com/send";
    const origWaToken = getVal("wa_gateway_token") || "";

    return (
      sessionTimeout !== origTimeout ||
      mapLockDuration !== origLock ||
      mfaEnforced !== origMfa ||
      waOtpEnabled !== origOtp ||
      waEnabled !== origWaEnabled ||
      waUrl !== origWaUrl ||
      waToken !== origWaToken
    );
  }, [settings, sessionTimeout, mapLockDuration, mfaEnforced, waOtpEnabled, waEnabled, waUrl, waToken]);

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
            <ComplianceSessionPoliciesCard
              sessionTimeout={sessionTimeout}
              setSessionTimeout={setSessionTimeout}
              mapLockDuration={mapLockDuration}
              setMapLockDuration={setMapLockDuration}
              mfaEnforced={mfaEnforced}
              setMfaEnforced={setMfaEnforced}
              waOtpEnabled={waOtpEnabled}
              setWaOtpEnabled={setWaOtpEnabled}
            />

            <ComplianceSpatialGovernanceCard spatialReport={spatialReport} />

            <ComplianceWhatsappGatewayCard
              waEnabled={waEnabled}
              setWaEnabled={setWaEnabled}
              waUrl={waUrl}
              setWaUrl={setWaUrl}
              waToken={waToken}
              setWaToken={setWaToken}
              isChanged={isChanged}
              isUpdating={isUpdating}
              onSave={handleSaveCompliance}
            />
          </div>
        </TracingBeam>
      </div>
    </div>
  );
}
