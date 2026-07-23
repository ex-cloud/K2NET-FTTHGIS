"use client";

import { useSecuritySettings, SecurityEvent } from "@/hooks/useSecuritySettings";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  ShieldAlert,
  AlertOctagon,
  Trash2,
  Play,
  MapPin,
  Plus,
  Globe,
  Skull,
  ShieldAlert as ShieldIcon,
  X,
  Radio,
} from "lucide-react";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Label } from "@k2net/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Skeleton } from "@k2net/ui";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// Deterministic coordinate lookup matching Java GeoIpService
function getCoordsForIp(ipAddress: string) {
  if (!ipAddress || ipAddress === "127.0.0.1" || ipAddress === "localhost" || ipAddress.startsWith("192.168.") || ipAddress.startsWith("10.")) {
    return { lat: -6.2088, lon: 106.8456 }; // Jakarta default
  }
  
  let hash = 0;
  for (let i = 0; i < ipAddress.length; i++) {
    const char = ipAddress.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  
  const mockLat = -6.2088 + (hash % 100) / 50.0;
  const mockLon = 106.8456 + ((Math.floor(hash / 100)) % 100) / 50.0;
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

  // Simulation form states
  const [simUserId, setSimUserId] = useState("00000000-0000-0000-0000-000000000001");
  const [simUsername, setSimUsername] = useState("john.doe");
  const [simIp, setSimIp] = useState("185.220.101.5");
  const [simFailIp, setSimFailIp] = useState("103.45.122.9");
  const [simFailCount, setSimFailCount] = useState(5);

  // Map state
  const [viewState, setViewState] = useState({
    longitude: 118.0,
    latitude: -2.5,
    zoom: 4,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleSimulateTravel = async () => {
    try {
      const res = await simulateTravel({
        userId: simUserId,
        username: simUsername,
        ipAddress: simIp,
      });
      if (res.triggeredAnomaly) {
        toast.warning(res.message || "Impossible Travel Anomaly triggered!");
      } else {
        toast.info(res.message || "Travel looks safe.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to simulate travel.");
    }
  };

  const handleSimulateFail = async () => {
    try {
      await simulateFail({
        username: simUsername,
        ipAddress: simFailIp,
        count: simFailCount,
      });
      toast.success(`Simulated ${simFailCount} failed logins successfully.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to simulate failed logins.");
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
  const markers = useMemo(() => {
    return alerts.map((alert) => {
      const coords = getCoordsForIp(alert.ipAddress);
      return {
        ...alert,
        coords,
      };
    });
  }, [alerts]);

  // Statistics
  const criticalCount = useMemo(() => alerts.filter(a => a.eventType === "IMPOSSIBLE_TRAVEL" || a.eventType === "BRUTE_FORCE_ATTEMPT" || a.severity === "CRITICAL").length, [alerts]);
  const warningCount = useMemo(() => alerts.filter(a => a.severity === "WARNING").length, [alerts]);

  const severityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL": return "border-rose-500/30 bg-rose-500/10 text-rose-400";
      case "WARNING": return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      default: return "border-border bg-card/30 text-muted-foreground";
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-4 md:px-8 bg-background h-full overflow-y-auto custom-scrollbar select-none text-foreground">
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-6 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-light text-foreground tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-rose-500" /> Threat Intelligence & Alerts
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time monitoring of impossible travel, brute-force logs, and low-level IP/CIDR blocking filters.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleClearLogs}
              disabled={alerts.length === 0}
              variant="destructive"
              className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 text-xs h-9 px-4 font-medium transition-all"
            >
              Clear Live Feed
            </Button>
          </div>
        </div>

        {/* Threat Level Indicator */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card className="bg-muted/35 border-border shadow-md backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Global Threats Status</p>
                <Radio className={`w-4 h-4 ${criticalCount > 0 ? "text-rose-500 animate-pulse" : "text-primary"}`} />
              </div>
              <p className={`text-2xl font-light mt-2 ${criticalCount > 0 ? "text-rose-400" : "text-primary"}`}>
                {criticalCount > 0 ? "Under Cyber Threat" : "Secured & Plausible"}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-muted/35 border-border shadow-md backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Critical Alerts</p>
                <Skull className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-light mt-2 text-rose-500 font-mono">{criticalCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/35 border-border shadow-md backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Warning Anomalies</p>
                <AlertOctagon className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-light mt-2 text-amber-500 font-mono">{warningCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/35 border-border shadow-md backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Blocked IP/CIDR Rules</p>
                <ShieldIcon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-light mt-2 text-primary font-mono">{blockedIps.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: IP CIDR Manager */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-card/30 border-border shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
                  <ShieldIcon className="w-4 h-4 text-primary" /> Firewall Block List
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                  Create high-performance low-level IP/CIDR filters to deny network handshake early.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <form onSubmit={handleBlockIp} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="block_ip" className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">IP Address / CIDR Range</Label>
                    <Input
                      id="block_ip"
                      placeholder="e.g. 103.111.12.5 or 192.168.1.0/24"
                      value={ipInput}
                      onChange={(e) => setIpInput(e.target.value)}
                      className="bg-background/60 border-border text-foreground text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="block_reason" className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Block Reason</Label>
                    <Input
                      id="block_reason"
                      placeholder="Reason for suspension"
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      className="bg-background/60 border-border text-foreground text-xs h-9"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isBlockingIp}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 font-medium transition-all shadow-md gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Block Network IP
                  </Button>
                </form>

                <div className="border-t border-border pt-4">
                  <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block mb-2">Active Rules ({blockedIps.length})</Label>
                  
                  {loadingBlockedIps ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full bg-muted" />
                      <Skeleton className="h-10 w-full bg-muted" />
                    </div>
                  ) : blockedIps.length === 0 ? (
                    <div className="text-center p-4 border border-dashed border-border rounded-lg bg-background/20 text-muted-foreground text-xs">
                      No IP blocking rules configured.
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar border border-border rounded-lg bg-background/40">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                            <th className="p-2 font-medium">IP/CIDR</th>
                            <th className="p-2 font-medium">Reason</th>
                            <th className="p-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blockedIps.map((rule) => (
                            <tr key={rule.id} className="border-b border-border/40 text-muted-foreground hover:bg-muted/10">
                              <td className="p-2 font-mono text-[10px] text-foreground">{rule.ipAddressOrCidr}</td>
                              <td className="p-2 text-[10px] text-muted-foreground max-w-[120px] truncate" title={rule.reason}>{rule.reason}</td>
                              <td className="p-2 text-right">
                                <button
                                  onClick={() => handleUnblockIp(rule.id)}
                                  className="text-rose-400 hover:text-rose-300 p-1 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column: Live Alert Feed */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-card/30 border-border shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-500 animate-pulse" /> Threat Live Feed
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Real-time security incidents log on master portal.
                  </CardDescription>
                </div>
                <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-mono">
                  Live
                </span>
              </CardHeader>
              <CardContent className="pt-5 p-3">
                {loadingAlerts ? (
                  <div className="space-y-3 p-3">
                    <Skeleton className="h-16 w-full bg-muted" />
                    <Skeleton className="h-16 w-full bg-muted" />
                    <Skeleton className="h-16 w-full bg-muted" />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center p-8 border border-dashed border-border rounded-xl bg-background/20 text-muted-foreground text-xs">
                    No security alerts detected. System secure.
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-3 pr-1">
                    {alerts.map((alert) => {
                      return (
                        <div
                          key={alert.id}
                          onClick={() => focusOnAlert(alert)}
                          className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                            selectedAlert?.id === alert.id
                              ? "border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30"
                              : "border-border bg-background/45 hover:border-border hover:bg-muted/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono ${severityColor(alert.severity)}`}>
                                {alert.eventType.replace("_", " ")}
                              </span>
                              <h4 className="text-xs font-semibold text-foreground mt-1">{alert.username}</h4>
                              <p className="text-[10px] text-muted-foreground font-mono">{alert.ipAddress} ({alert.location || "Unknown"})</p>
                            </div>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {new Date(alert.createdAt).toLocaleTimeString("id-ID", { hour12: false })}
                            </span>
                          </div>
                          
                          {selectedAlert?.id === alert.id && (
                            <div className="mt-3 pt-3 border-t border-border/60 text-[10px] text-muted-foreground leading-relaxed font-sans space-y-2">
                              <p className="text-muted-foreground bg-background/80 p-2 rounded-lg border border-border/40">{alert.details}</p>
                              {alert.os && (
                                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-muted-foreground pt-1">
                                  <span>OS: {alert.os}</span>
                                  <span>Browser: {alert.browser}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Map & Simulation */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Attack Map Card */}
            <Card className="bg-card/30 border-border shadow-xl backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-rose-500" /> Geographic Threat Map
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                  Interactive visualization of suspicious sign-ins.
                </CardDescription>
              </CardHeader>
              <div className="relative h-[250px] w-full bg-background">
                <Map
                  {...viewState}
                  onMove={evt => setViewState(evt.viewState)}
                  mapStyle="https://tiles.openfreemap.org/styles/dark"
                  style={{ width: "100%", height: "100%" }}
                >
                  {markers.map((marker) => {
                    const isSelected = selectedAlert?.id === marker.id;
                    return (
                      <Marker
                        key={marker.id}
                        longitude={marker.coords.lon}
                        latitude={marker.coords.lat}
                        anchor="bottom"
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            focusOnAlert(marker);
                          }}
                          className="relative cursor-pointer group"
                        >
                          <div className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping ${
                            marker.severity === "CRITICAL" ? "bg-rose-500/40" : "bg-amber-500/40"
                          } w-6 h-6`} />
                          <MapPin className={`w-5 h-5 -translate-x-1/2 -translate-y-full transition-all duration-300 ${
                            isSelected 
                              ? "text-rose-400 scale-125 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" 
                              : "text-rose-600 hover:text-rose-400 hover:scale-110"
                          }`} />
                          
                          {/* Mini Tooltip */}
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-background border border-border px-2 py-1 rounded text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
                            {marker.username} - {marker.eventType}
                          </div>
                        </div>
                      </Marker>
                    );
                  })}
                </Map>

                {selectedAlert && (
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-foreground z-10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </Card>

            {/* Simulators Card */}
            <Card className="bg-card/30 border-border shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" /> Incident Simulator
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                  Generate mock login events to test the alert feed, email verification, and firewall blocks.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                
                {/* Impossible Travel Simulation */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider font-mono">1. Impossible Travel</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="sim_user" className="text-muted-foreground text-[9px]">User ID</Label>
                      <Input
                        id="sim_user"
                        value={simUserId}
                        onChange={(e) => setSimUserId(e.target.value)}
                        className="bg-background/60 border-border text-muted-foreground text-[10px] h-7"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sim_username" className="text-muted-foreground text-[9px]">Username</Label>
                      <Input
                        id="sim_username"
                        value={simUsername}
                        onChange={(e) => setSimUsername(e.target.value)}
                        className="bg-background/60 border-border text-muted-foreground text-[10px] h-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sim_ip" className="text-muted-foreground text-[9px]">Simulated Remote IP</Label>
                    <Input
                      id="sim_ip"
                      value={simIp}
                      onChange={(e) => setSimIp(e.target.value)}
                      className="bg-background/60 border-border text-muted-foreground text-[10px] h-7"
                    />
                  </div>
                  <Button
                    onClick={handleSimulateTravel}
                    disabled={isSimulating}
                    className="w-full bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/35 text-rose-400 text-xs h-8 font-medium transition-all shadow-md gap-2"
                  >
                    Simulate Travel Anomaly
                  </Button>
                </div>

                <div className="border-t border-border/60 pt-4 space-y-3">
                  {/* Brute Force Simulation */}
                  <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider font-mono">2. Brute Force Login</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="sim_fail_ip" className="text-muted-foreground text-[9px]">Attacker IP</Label>
                      <Input
                        id="sim_fail_ip"
                        value={simFailIp}
                        onChange={(e) => setSimFailIp(e.target.value)}
                        className="bg-background/60 border-border text-muted-foreground text-[10px] h-7"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sim_fail_count" className="text-muted-foreground text-[9px]">Fail Count</Label>
                      <Input
                        id="sim_fail_count"
                        type="number"
                        min={1}
                        max={20}
                        value={simFailCount}
                        onChange={(e) => setSimFailCount(Number(e.target.value))}
                        className="bg-background/60 border-border text-muted-foreground text-[10px] h-7"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSimulateFail}
                    disabled={isSimulating}
                    className="w-full bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/35 text-rose-400 text-xs h-8 font-medium transition-all shadow-md gap-2"
                  >
                    Simulate Brute Force
                  </Button>
                </div>

              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
