import { useSecuritySettings, type SecurityEvent } from "@/hooks/useSecuritySettings";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { Button, ActionTooltip } from "@k2net/ui";
import { AlertsKpiCards } from "@/components/security/alerts-kpi-cards";
import { AlertsFirewallCard } from "@/components/security/alerts-firewall-card";
import { AlertsFeedCard } from "@/components/security/alerts-feed-card";
import { AlertsMapCard, type GeoMarker } from "@/components/security/alerts-map-card";
import { AlertsSimulatorCard } from "@/components/security/alerts-simulator-card";

function getCoordsForIp(ipAddress: string) {
  if (
    !ipAddress ||
    ipAddress === "127.0.0.1" ||
    ipAddress === "localhost" ||
    ipAddress.startsWith("192.168.") ||
    ipAddress.startsWith("10.")
  ) {
    return { lat: -6.2088, lon: 106.8456 }; // Jakarta default
  }

  let hash = 0;
  for (let i = 0; i < ipAddress.length; i++) {
    const char = ipAddress.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  const mockLat = -6.2088 + (hash % 100) / 50.0;
  const mockLon = 106.8456 + (Math.floor(hash / 100) % 100) / 50.0;
  return { lat: mockLat, lon: mockLon };
}

export default function SecurityAlertsPage() {
  const {
    alerts,
    loadingAlerts,
    clearAlerts,
    simulateTravel,
    simulateFail,
    isSimulating,
    blockedIps,
    loadingBlockedIps,
    blockIp,
    isBlockingIp,
    unblockIp,
  } = useSecuritySettings();

  const [mounted, setMounted] = useState(false);
  const [ipInput, setIpInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<SecurityEvent | null>(null);

  // Map state
  const [viewState, setViewState] = useState({
    longitude: 118.0,
    latitude: -2.5,
    zoom: 4,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim()) {
      toast.error("Please enter a valid IP address or CIDR range.");
      return;
    }

    try {
      await blockIp({
        ipAddressOrCidr: ipInput.trim(),
        reason: reasonInput.trim() || "Manual block by Administrator",
      });
      toast.success("IP/CIDR blocked successfully!");
      setIpInput("");
      setReasonInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to block IP.");
    }
  };

  const handleUnblockIp = async (id: number) => {
    try {
      await unblockIp(id);
      toast.success("IP/CIDR unblocked successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unblock IP.");
    }
  };

  const handleClearLogs = async () => {
    try {
      await clearAlerts();
      toast.success("Security logs cleared successfully.");
      setSelectedAlert(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear logs.");
    }
  };

  const focusOnAlert = (alert: SecurityEvent) => {
    setSelectedAlert(alert);
    const coords = getCoordsForIp(alert.ipAddress);
    setViewState({
      longitude: coords.lon,
      latitude: coords.lat,
      zoom: 7,
    });
  };

  // Compute alert coordinates for markers
  const markers: GeoMarker[] = useMemo(() => {
    return alerts.map((alert) => ({
      ...alert,
      coords: getCoordsForIp(alert.ipAddress),
    }));
  }, [alerts]);

  const criticalCount = useMemo(
    () =>
      alerts.filter(
        (a) =>
          a.eventType === "IMPOSSIBLE_TRAVEL" || a.eventType === "BRUTE_FORCE_ATTEMPT" || a.severity === "CRITICAL"
      ).length,
    [alerts]
  );
  const warningCount = useMemo(() => alerts.filter((a) => a.severity === "WARNING").length, [alerts]);

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto custom-scrollbar select-none text-foreground">
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-6 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-rose-500" /> Threat Intelligence & Alerts
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time monitoring of impossible travel, brute-force logs, and low-level IP/CIDR blocking filters.
            </p>
          </div>
          <div className="flex gap-3">
            <ActionTooltip label="Bersihkan Log Threat Feed" shortcut="Alt+C">
              <Button
                onClick={handleClearLogs}
                disabled={alerts.length === 0}
                variant="destructive"
                className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 text-xs h-9 px-4 font-medium transition-all"
              >
                Clear Live Feed
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* Threat Level Indicator */}
        <AlertsKpiCards
          criticalCount={criticalCount}
          warningCount={warningCount}
          blockedCount={blockedIps.length}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: IP CIDR Manager */}
          <div className="lg:col-span-4 space-y-6">
            <AlertsFirewallCard
              ipInput={ipInput}
              setIpInput={setIpInput}
              reasonInput={reasonInput}
              setReasonInput={setReasonInput}
              handleBlockIp={handleBlockIp}
              isBlockingIp={isBlockingIp}
              loadingBlockedIps={loadingBlockedIps}
              blockedIps={blockedIps}
              handleUnblockIp={handleUnblockIp}
            />
          </div>

          {/* Middle Column: Live Alert Feed */}
          <div className="lg:col-span-4 space-y-6">
            <AlertsFeedCard
              alerts={alerts}
              loadingAlerts={loadingAlerts}
              selectedAlert={selectedAlert}
              onSelectAlert={focusOnAlert}
              onBlockIpShortcut={(ip, reason) => {
                setIpInput(ip);
                setReasonInput(reason);
              }}
            />
          </div>

          {/* Right Column: Map & Simulation */}
          <div className="lg:col-span-4 space-y-6">
            <AlertsMapCard
              viewState={viewState}
              onViewStateChange={setViewState}
              markers={markers}
              selectedAlert={selectedAlert}
              onSelectAlert={focusOnAlert}
              onClearSelectedAlert={() => setSelectedAlert(null)}
            />

            <AlertsSimulatorCard
              simulateTravel={simulateTravel}
              simulateFail={simulateFail}
              isSimulating={isSimulating}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
