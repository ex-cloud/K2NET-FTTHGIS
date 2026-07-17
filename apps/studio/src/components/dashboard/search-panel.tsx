"use client";

import { Search, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSelectionStore } from "@/store/selection-store";
import { useMapStore } from "@/store/map-store";
import { useSession } from "next-auth/react";
import { networkApi } from "@/lib/api/network";

interface SearchResult {
  id: string;
  code: string;
  type: string;
  lng: number;
  lat: number;
  status: string;
}

export function SearchPanel({
  placeholder = "Search ODC, ODP, or code...",
}: {
  placeholder?: string;
}) {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { setSelectedAsset } = useSelectionStore();
  const { setMapCenter } = useMapStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const projectId = params?.projectId as string;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await networkApi.searchAssets(query, "", session?.accessToken as string);
        setResults(data);
        setShowResults(true);
      } catch (err) {
        console.error("Search failed", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, session?.accessToken, projectId]);

  const handleSelect = useCallback((asset: SearchResult) => {
    setSelectedAsset({
      id: asset.id,
      type: asset.type,
      code: asset.code,
      lng: asset.lng,
      lat: asset.lat,
      status: asset.status,
    });
    setMapCenter({ lng: asset.lng, lat: asset.lat, zoom: 18 });
    setShowResults(false);
    setQuery("");
  }, [setMapCenter, setSelectedAsset]);

  return (
    <div
      className="relative z-50 w-[320px] bg-background/80 backdrop-blur-xl rounded-xl border border-border/40 shadow-xl pointer-events-auto transition-all"
      ref={containerRef}
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        className="w-full bg-transparent border-0 pl-10 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setShowResults(true)}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        </div>
      )}

      {showResults &&
        (results.length > 0 ||
          /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(query)) && (
          <div className="absolute top-12 left-0 right-0 bg-background/95 backdrop-blur-md rounded-xl border border-border/50 shadow-2xl overflow-hidden z-50">
            <div className="p-2 space-y-1">
              {/* Coordinate Jump Option */}
              {/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(query) && (
                <button
                  onClick={() => {
                    const [lat, lng] = query
                      .split(",")
                      .map((s) => parseFloat(s.trim()));

                    // Proactively set selected asset to open detail panel
                    setSelectedAsset({
                      id: "target",
                      type: "COORDINATE",
                      code: "SEARCH TARGET",
                      lat,
                      lng,
                      status: "ACTIVE", // Manual coordinate search color is always blue/active
                    });

                    setMapCenter({ lng, lat, zoom: 19 });
                    setShowResults(false);
                    setQuery("");
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-primary/10 rounded-lg transition-colors group border-b border-border/20 mb-1"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-primary">
                      Go to Coordinates
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {query}
                    </div>
                  </div>
                </button>
              )}

              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors group"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                      result.type === "ODC"
                        ? "bg-sky-500/10 text-sky-500"
                        : result.type === "ODP"
                          ? "bg-rose-500/10 text-rose-500"
                          : result.type === "OLT"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-primary/10 text-primary" // CUSTOMER
                    }`}
                  >
                    {result.type === "CUSTOMER" ? "CUST" : result.type}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold font-mono group-hover:text-primary transition-colors">
                      {result.code}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-2 h-2" />
                      {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      {showResults &&
        query.length >= 2 &&
        results.length === 0 &&
        !loading &&
        !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(query) && (
          <div className="absolute top-12 left-0 right-0 bg-background/95 backdrop-blur-md rounded-xl border border-border/50 p-4 text-center text-xs text-muted-foreground">
            No matches found for &quot;{query}&quot;
          </div>
        )}
    </div>
  );
}
