"use client";

import { X, Cloud, ZapOff, PlayCircle, Loader2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSelectionStore } from "@/store/selection-store";
import { useMapStore } from "@/store/map-store";
import { useEffect, useState, useCallback } from "react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";

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

export function AssetPanel() {
  const { selectedAsset, setSelectedAsset } = useSelectionStore();
  const { statusOverrides } = useMapStore();
  const [details, setDetails] = useState<AssetDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagResult, setDiagResult] = useState<DiagnosticResult | null>(null);

  const fetchAssetDetails = useCallback(async () => {
    if (!selectedAsset) {
      setDetails(null);
      setDiagResult(null);
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

  useEffect(() => {
    fetchAssetDetails();
  }, [fetchAssetDetails]);

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
    return (
      <div className="flex flex-col items-end gap-4 pointer-events-none absolute bottom-6 right-6 z-10">
        <div className="pointer-events-auto flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full h-8 text-xs font-medium bg-background/60 backdrop-blur hover:bg-background/80"
          >
            <Cloud className="w-3 h-3 mr-2" /> Weather
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-8 text-xs font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
          >
            <ZapOff className="w-3 h-3 mr-2" /> Power
          </Button>
        </div>
      </div>
    );
  }

  const activeStatus = (
    statusOverrides[details?.code || ""] ||
    details?.status ||
    "UP"
  ).toUpperCase();

  return (
    <div className="flex flex-col items-end gap-4 pointer-events-none absolute bottom-6 right-6 z-10 uppercase">
      {/* Action Bar */}
      <div className="pointer-events-auto flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full h-8 text-xs font-medium bg-background/60 backdrop-blur hover:bg-background/80"
        >
          <Cloud className="w-3 h-3 mr-2" /> Weather
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-8 text-xs font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
        >
          <ZapOff className="w-3 h-3 mr-2" /> Power Grid
        </Button>
      </div>

      <Card className="pointer-events-auto w-80 bg-background/80 backdrop-blur border-border/50 shadow-2xl p-6 rounded-3xl overflow-hidden relative min-h-[450px]">
        {/* Loading Overlay */}
        {(loading || diagnosing) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-[10px] font-bold tracking-tighter animate-pulse">
                {diagnosing ? "ANALYZING SIGNAL..." : "SYNCING DATA..."}
              </span>
            </div>
          </div>
        )}

        {details ? (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground mb-1 tracking-widest">
                  {details.type} INFRASTRUCTURE
                </h3>
                <h1 className="text-2xl font-black font-mono tracking-tighter text-foreground leading-none">
                  {details.code}
                </h1>
                <div className="flex flex-wrap gap-1 mt-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit italic mr-2">
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
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black w-fit ${isRed ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"}`}
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
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Dynamic Attributes */}
            <div className="space-y-3 mb-6">
              {Object.entries(details.attributes || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center border-b border-border/20 pb-1.5"
                >
                  <span className="text-[10px] text-muted-foreground font-bold tracking-wide">
                    {key}
                  </span>
                  <span className="text-xs font-mono font-medium">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Live Diagnostics Section */}
            {diagResult && (
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 mb-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 mb-2">
                  <Activity className="w-3 h-3" /> LIVE SIGNAL ANALYSIS
                </div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-black font-mono tracking-tighter">
                    {diagResult.signal}
                  </span>
                  <span className="text-[10px] font-bold mb-1 ml-1 text-muted-foreground">
                    dBm
                  </span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded text-[8px] font-black ${diagResult.health === "OPTIMAL" ? "bg-emerald-500" : "bg-amber-500"} text-white uppercase`}
                  >
                    {diagResult.health}
                  </span>
                </div>
                <p className="text-[9px] font-medium leading-tight text-muted-foreground italic normal-case">
                  &quot;{diagResult.message}&quot;
                </p>
              </div>
            )}

            {!diagResult && (
              <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 mb-6 font-mono">
                <div className="text-[9px] text-muted-foreground mb-2">
                  STATIC HEALTH SCORE
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px]">OPTIMAL</span>
                  <span className="text-[10px] text-emerald-500">98.2%</span>
                </div>
                <div className="w-full h-1 bg-muted-foreground/10 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[98%]" />
                </div>
              </div>
            )}

            <Button
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-2xl h-12 font-black tracking-wide"
              onClick={handleRunDiagnostics}
              disabled={loading || diagnosing}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              {diagnosing ? "ANALYZING..." : "RUN DIAGNOSTICS"}
            </Button>
          </>
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
