"use client";

import { X, PlayCircle, Loader2, Activity, Cable, History, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSelectionStore } from "@/store/selection-store";
import { useMapStore } from "@/store/map-store";
import { useEffect, useState, useCallback } from "react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AssetDetails {
  id: string;
  code: string;
  type: string;
  status: string;
  labels?: string[];
  attributes: Record<string, string | number | boolean | null>;
}

interface DiagnosticResult {
  signal: number;
  unit: string;
  health: string;
  message: string;
}

interface AuditHistoryEntry {
  revisionNumber: number;
  revisionTimestamp: string;
  revisionType: string;
  status: string;
  lastNote: string | null;
  modifiedBy: string | null;
}

export function AssetPanel() {
  const { selectedAsset, setSelectedAsset } = useSelectionStore();
  const { statusOverrides, startTraceMode, traceMode } = useMapStore();
  const [details, setDetails] = useState<AssetDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagResult, setDiagResult] = useState<DiagnosticResult | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryEntry[]>([]);

  const fetchAssetDetails = useCallback(async () => {
    if (!selectedAsset) {
      setDetails(null);
      setDiagResult(null);
      setAuditHistory([]);
      return;
    }

    // Handle dummy search targets / coordinates
    if (selectedAsset.type === "COORDINATE") {
      setDetails({
        id: selectedAsset.id,
        code: selectedAsset.code || "SEARCH TARGET",
        type: "COORDINATE",
        status: "MANUAL_PIN",
        attributes: {
          Latitude: selectedAsset.lat?.toFixed(6) || "0",
          Longitude: selectedAsset.lng?.toFixed(6) || "0",
          Source: "Manual Coordinate Search",
        },
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setDiagResult(null);
    try {
      const baseUrl = getBackendBaseUrl();
      // Try Code lookup first (more reliable after reseeding)
      const codeUrl = `${baseUrl}/network/assets/by-code/${selectedAsset.type}/${selectedAsset.code}`;
      let response = await fetch(codeUrl);

      // Fallback to ID lookup if Code fails
      if (!response.ok && selectedAsset.id) {
        const idUrl = `${baseUrl}/network/assets/${selectedAsset.type}/${selectedAsset.id}`;
        response = await fetch(idUrl);
      }

      if (!response.ok) throw new Error("Asset not found");
      const data = await response.json();
      setDetails(data);
    } catch (e) {
      console.error("Detail Fetch Error:", e);
      // Create a fallback detail from selectedAsset itself to prevent permanent loading spinner
      setDetails({
        id: selectedAsset.id,
        code: selectedAsset.code || `${selectedAsset.type}-${selectedAsset.id}`,
        type: selectedAsset.type,
        status: selectedAsset.status || "UNKNOWN",
        attributes: {
          Note: "Real-time details offline",
        },
      });
    } finally {
      setLoading(false);
    }
  }, [selectedAsset]);

  const tileRefreshKey = useMapStore((state) => state.tileRefreshKey);

  useEffect(() => {
    fetchAssetDetails();
  }, [fetchAssetDetails, tileRefreshKey]);

  // Fetch audit history when details are loaded
  useEffect(() => {
    if (!details || details.type === "COORDINATE") {
      setAuditHistory([]);
      return;
    }
    const fetchHistory = async () => {
      try {
        const baseUrl = getBackendBaseUrl();
        const response = await fetch(
          `${baseUrl}/network/assets/${details.type}/${details.code}/history`
        );
        if (response.ok) {
          const data = await response.json();
          setAuditHistory(data);
        }
      } catch (e) {
        console.error("Failed to fetch audit history:", e);
      }
    };
    fetchHistory();
  }, [details]);

  const handleRunDiagnostics = async () => {
    if (!details) return;
    setDiagnosing(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const response = await fetch(
        `${baseUrl}/network/assets/${details.type}/${details.code}/diagnostics`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Diagnostics failed");
      const data = await response.json();
      setDiagResult(data);
      toast.success("Diagnostics Complete", {
        description: `Status: ${data.health} | Level: ${data.signal} ${data.unit}`,
      });
    } catch (e) {
      console.error("Diagnostics Error:", e);
      toast.error("Diagnostics Error", {
        description: "Remote server did not respond or access denied.",
      });
    } finally {
      setDiagnosing(false);
    }
  };

  if (!selectedAsset) {
    return null;
  }

  const activeStatus = (
    statusOverrides[details?.code || ""] ||
    details?.status ||
    "UP"
  ).toUpperCase();

  return (
    <div className="flex flex-col items-end gap-4 pointer-events-none absolute bottom-[104px] right-4 z-10 uppercase">
      <Card className="pointer-events-auto w-[320px] bg-background/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-6 rounded-xl overflow-hidden relative min-h-[450px]">
        {/* Loading Overlay */}
        {(loading || diagnosing) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-[10px] font-bold tracking-tighter animate-pulse text-foreground">
                {diagnosing ? "ANALYZING SIGNAL..." : "SYNCING DATA..."}
              </span>
            </div>
          </div>
        )}

        {details ? (
          <div className="flex flex-col h-full overflow-y-auto pr-1 -mr-1 custom-scrollbar">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground mb-1 tracking-widest">
                  {details.type} INFRASTRUCTURE
                </h3>
                <h1 className="text-2xl font-black font-mono tracking-tighter text-foreground leading-none">
                  {details.code}
                </h1>
                <div className="flex flex-wrap gap-1 mt-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit italic mr-2 border border-border/40">
                    LAT: {selectedAsset.lat?.toFixed(6)} | LNG:{" "}
                    {selectedAsset.lng?.toFixed(6)}
                  </div>
                  {(details.labels && details.labels.length > 0
                    ? details.labels
                    : [activeStatus]
                  ).map((label) => {
                    const l = label.toUpperCase();
                    const isRed = [
                      "DOWN",
                      "FIBERCUT",
                      "BROKEN",
                      "CRITICAL",
                    ].includes(l);
                    return (
                      <span
                        key={label}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black w-fit ${isRed ? "bg-red-500/20 text-red-500 border border-red-500/20" : "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"}`}
                      >
                        {l}
                      </span>
                    );
                  })}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAsset(null)}
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Dynamic Attributes */}
            <div className="space-y-3 mb-6">
              {Object.entries(details.attributes || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center border-b border-border/40 pb-1.5"
                >
                  <span className="text-[10px] text-muted-foreground font-bold tracking-wide">
                    {key}
                  </span>
                  <span className="text-xs font-mono font-medium text-foreground/90">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Live Diagnostics Section */}
            {diagResult && (
              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 mb-6 animate-in fade-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 mb-2">
                  <Activity className="w-3 h-3 animate-pulse" /> LIVE SIGNAL
                  ANALYSIS
                </div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-black font-mono tracking-tighter text-foreground">
                    {diagResult.signal}
                  </span>
                  <span className="text-[10px] font-bold mb-1 ml-1 text-emerald-500/70">
                    dBm
                  </span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded text-[8px] font-black shadow-lg ${diagResult.health === "OPTIMAL" ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-500 shadow-amber-500/50"} text-white uppercase`}
                  >
                    {diagResult.health}
                  </span>
                </div>
                <p className="text-[9px] font-medium leading-tight text-emerald-500/80 italic normal-case">
                  &quot;{diagResult.message}&quot;
                </p>
              </div>
            )}

            {!diagResult && (
              <div className="p-4 bg-muted/30 rounded-xl border border-border/40 mb-6 font-mono relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]" />
                <div className="text-[9px] text-muted-foreground mb-2">
                  STATIC HEALTH SCORE
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-foreground/70">OPTIMAL</span>
                  <span className="text-[10px] text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
                    98.2%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div className="bg-emerald-500 h-full w-[98%] shadow-[0_0_10px_rgba(16,185,129,1)] transition-all duration-1000 ease-in-out" />
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <Button
                className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl h-11 font-black tracking-wide transition-all"
                onClick={handleRunDiagnostics}
                disabled={loading || diagnosing}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {diagnosing ? "ANALYZING..." : "RUN DIAGNOSTICS"}
              </Button>

              {/* Trace Route Button — only for nodes, not cables/coordinates */}
              {details && ["OLT", "ODC", "ODP"].includes(details.type) && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-10 font-bold tracking-wide border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10"
                  onClick={() => {
                    startTraceMode({
                      id: details.id,
                      code: details.code,
                    });
                  }}
                  disabled={traceMode === "selecting-target"}
                >
                  <Cable className="w-4 h-4 mr-2" />
                  {traceMode === "selecting-target"
                    ? "SELECT TARGET ON MAP..."
                    : "TRACE FIBER ROUTE"}
                </Button>
              )}
            </div>

            {/* Advisor: Audit History Timeline */}
            <Collapsible defaultOpen={true} className="mt-2 mb-6">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2.5 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                  <History className="w-3.5 h-3.5" />
                  <span>AUDIT TRAIL ({auditHistory.length})</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 max-h-[300px] overflow-visible pr-1 space-y-0 pb-2">
                  {auditHistory.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground italic py-4 text-center bg-muted/10 rounded-lg border border-dashed border-border/40">
                      No operational history recorded yet.
                    </div>
                  ) : (
                    auditHistory.map((entry, idx) => {
                      const isLatest = idx === 0;
                      const statusColor = ["DOWN", "FIBERCUT", "BROKEN"].includes(entry.status?.toUpperCase() || "")
                        ? "text-red-500 bg-red-500"
                        : entry.status?.toUpperCase() === "MAINTENANCE"
                          ? "text-amber-500 bg-amber-500"
                          : "text-emerald-500 bg-emerald-500";
                      const dotColor = statusColor.split(" ")[1];
                      const textColor = statusColor.split(" ")[0];
                      const date = new Date(entry.revisionTimestamp);
                      const formattedDate = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
                      const formattedTime = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

                      return (
                        <div key={entry.revisionNumber} className="flex gap-3 relative">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0 mt-1.5 ${isLatest ? "ring-2 ring-offset-1 ring-offset-background" : "opacity-60"}`}
                              style={isLatest ? { boxShadow: `0 0 10px rgba(16,185,129,0.4)` } : {}} />
                            {idx < auditHistory.length - 1 && (
                              <div className="w-px flex-1 bg-border/60 min-h-[25px]" />
                            )}
                          </div>
                          <div className="pb-5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${dotColor}/20 ${textColor}`}>
                                {entry.status || "N/A"}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-mono">
                                {formattedDate} {formattedTime}
                              </span>
                            </div>
                            {entry.lastNote && (
                              <p className="text-[10px] text-foreground/90 mt-1.5 normal-case italic leading-relaxed bg-muted/20 p-2 rounded-lg border border-border/20">
                                &quot;{entry.lastNote}&quot;
                              </p>
                            )}
                            {entry.modifiedBy && (
                              <p className="text-[9px] text-muted-foreground mt-1 normal-case">
                                oleh <span className="text-foreground/60 font-medium">{entry.modifiedBy}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground text-center">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-10" />
            <p className="text-sm font-bold tracking-tighter">
              Validating Network Link...
            </p>
            <p className="text-[9px] opacity-40 mt-1 max-w-[200px]">
              Establishing secure connection to Enterprise GIS Core...
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
