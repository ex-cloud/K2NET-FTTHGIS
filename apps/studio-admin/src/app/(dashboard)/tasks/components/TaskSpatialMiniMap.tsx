"use client";

import React, { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { MapPin, ExternalLink, Copy, Navigation, Radio } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskSpatialMiniMapProps {
  latitude?: number | string | null;
  longitude?: number | string | null;
  assetCode?: string | null;
  textContext?: string | null;
  title?: string;
  className?: string;
}

const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/bright",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

export function TaskSpatialMiniMap({
  latitude,
  longitude,
  assetCode,
  textContext,
  title,
  className,
}: TaskSpatialMiniMapProps) {
  const { resolvedTheme } = useTheme();

  // Parse numeric coordinates or extract from textContext
  const parsedCoords = useMemo(() => {
    if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
      const lat = typeof latitude === "number" ? latitude : parseFloat(String(latitude));
      const lng = typeof longitude === "number" ? longitude : parseFloat(String(longitude));
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    // Fallback: extract lat/lng from textContext
    if (textContext) {
      const coordRegex = /([-+]?\d{1,2}\.\d{3,})\s*,\s*([-+]?\d{1,3}\.\d{3,})/;
      const match = textContext.match(coordRegex);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }

    return null;
  }, [latitude, longitude, textContext]);

  const mapStyle = resolvedTheme === "light" ? MAP_STYLES.light : MAP_STYLES.dark;

  if (!parsedCoords) return null;

  const handleCopyCoords = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${parsedCoords.lat.toFixed(6)}, ${parsedCoords.lng.toFixed(6)}`);
    toast.success("Koordinat disalin ke clipboard");
  };

  const handleOpenGis = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/observability/spatial-map?lat=${parsedCoords.lat}&lng=${parsedCoords.lng}&zoom=16`, "_blank");
  };

  return (
    <div className={cn("rounded-2xl border border-border/70 overflow-hidden bg-card/60 shadow-md flex flex-col", className)}>
      {/* Header Info Strip */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/50 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <Radio className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
          <span className="font-bold text-foreground truncate">
            {assetCode ? `GIS Asset: ${assetCode}` : "Lokasi Lapangan"}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopyCoords}
            className="p-1 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Salin Koordinat"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleOpenGis}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-semibold transition-colors cursor-pointer text-[11px]"
            title="Buka di Peta GIS Utama"
          >
            <span>GIS Map</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative w-full h-[180px] bg-muted/20">
        <Map
          initialViewState={{
            latitude: parsedCoords.lat,
            longitude: parsedCoords.lng,
            zoom: 15,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          attributionControl={false}
        >
          <NavigationControl position="bottom-right" showCompass={false} />

          {/* Glowing Animated Marker */}
          <Marker latitude={parsedCoords.lat} longitude={parsedCoords.lng} anchor="bottom">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-7 h-7 rounded-full bg-primary/30 animate-ping" />
              <div className="relative w-8 h-8 rounded-full bg-card border-2 border-primary shadow-lg flex items-center justify-center text-primary">
                <MapPin className="w-4 h-4 fill-primary/20" />
              </div>
            </div>
          </Marker>
        </Map>

        {/* Floating Coordinates Badge */}
        <div className="absolute bottom-2 left-2 z-10 px-2 py-1 rounded-lg bg-background/85 backdrop-blur-md border border-border/60 text-[10px] font-mono text-muted-foreground shadow-xs pointer-events-none">
          {parsedCoords.lat.toFixed(5)}, {parsedCoords.lng.toFixed(5)}
        </div>
      </div>
    </div>
  );
}
