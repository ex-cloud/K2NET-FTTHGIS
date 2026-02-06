"use client";

import { X, Cloud, ZapOff, BugPlay, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSelectionStore } from "@/store/selection-store";
import { useEffect, useState } from "react";

interface AssetDetails {
  id: string;
  code: string;
  type: string;
  status: string;
  properties: Record<string, string | number | boolean | null>;
}

export function AssetPanel() {
  const { selectedAsset, setSelectedAsset } = useSelectionStore();
  const [details, setDetails] = useState<AssetDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAssetDetails() {
      if (!selectedAsset) {
        setDetails(null);
        return;
      }

      if (selectedAsset.type === "COORDINATE") {
        setDetails({
          id: selectedAsset.id,
          code: selectedAsset.code || "SEARCH TARGET",
          type: "COORDINATE",
          status: "MANUAL_PIN",
          properties: {
            Latitude: selectedAsset.lat?.toFixed(6) || "0",
            Longitude: selectedAsset.lng?.toFixed(6) || "0",
            Source: "Manual Coordinate Search",
          },
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/network/assets/${selectedAsset.type}/${selectedAsset.id}`,
        );
        if (!response.ok) throw new Error("Asset not found");
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        console.error("Failed to fetch asset details", err);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAssetDetails();
  }, [selectedAsset]);

  if (!selectedAsset) {
    return (
      <div className="flex flex-col items-end gap-4 pointer-events-none absolute bottom-6 right-6 z-10">
        <div className="pointer-events-auto flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full h-8 text-xs font-medium bg-background/60 backdrop-blur hover:bg-background/80"
          >
            <Cloud className="w-3 h-3 mr-2" /> Weather Overlay
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-8 text-xs font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-500"
          >
            <ZapOff className="w-3 h-3 mr-2" /> Power Grid
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-4 pointer-events-none absolute bottom-6 right-6 z-10 uppercase">
      {/* Top Floating Buttons */}
      <div className="pointer-events-auto flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full h-8 text-xs font-medium bg-background/60 backdrop-blur hover:bg-background/80"
        >
          <Cloud className="w-3 h-3 mr-2" />
          Weather Overlay
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-8 text-xs font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-500"
        >
          <ZapOff className="w-3 h-3 mr-2" />
          Power Grid
        </Button>
      </div>

      <Card className="pointer-events-auto w-80 bg-background/80 backdrop-blur border-border/50 shadow-2xl p-6 rounded-3xl overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : details ? (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-widest">
                  {details.type} Details
                </h3>
                <h1 className="text-2xl font-black font-mono tracking-tighter text-foreground">
                  {details.code}
                </h1>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit italic">
                    <span className="opacity-70">LAT:</span>{" "}
                    {selectedAsset?.lat?.toFixed(6) || "0"}
                    <span className="opacity-70 ml-2">LNG:</span>{" "}
                    {selectedAsset?.lng?.toFixed(6) || "0"}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        details?.status === "ACTIVE" ||
                        details?.status === "MANUAL_PIN"
                          ? "bg-emerald-500/20 text-emerald-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {details?.status || "UNKNOWN"}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAsset(null)}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 mb-6">
              {Object.entries(details.properties || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center border-b border-border/40 pb-2"
                >
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    {key}
                  </span>
                  <span className="text-xs font-mono font-medium">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 mb-6 font-mono">
              <div className="text-[9px] text-muted-foreground uppercase mb-2">
                Technical Health
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px]">OPTIMAL RANGE</span>
                <span className="text-[10px] text-emerald-500">98.2%</span>
              </div>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[98%]" />
              </div>
            </div>

            <Button
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-2xl h-12 font-bold"
              variant="default"
            >
              <BugPlay className="w-4 h-4 mr-2" />
              Run Diagnostics
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
            <p className="text-sm">Select an asset from the map</p>
          </div>
        )}
      </Card>
    </div>
  );
}
