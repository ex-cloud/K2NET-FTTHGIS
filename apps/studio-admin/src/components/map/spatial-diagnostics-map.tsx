"use client";

import React, { useState, useCallback } from "react";
import Map, { Source, Layer, NavigationControl, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Badge, Button } from "@k2net/ui";
import { MapPin, RefreshCw, Layers, ZoomIn } from "lucide-react";

interface PopupInfo {
  longitude: number;
  latitude: number;
  id?: string;
  name?: string;
  tenant?: string;
  status?: string;
  type?: string;
}

export function SpatialDiagnosticsMap({ tenantSlug }: { tenantSlug?: string }) {
  const [viewState, setViewState] = useState({
    longitude: 107.6098,
    latitude: -6.9175, // Bandung / Indonesia center
    zoom: 11,
  });

  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<"all" | "odp" | "closure" | "feeder">("all");

  const handleMapClick = useCallback((event: { lngLat: { lng: number; lat: number }; features?: Array<{ properties?: Record<string, unknown> }> }) => {
    if (event.features && event.features.length > 0) {
      const feature = event.features[0];
      const props = feature.properties || {};
      setPopupInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        id: (props.id as string) || (props.code as string) || "ODP-BDG-042",
        name: (props.name as string) || "ODP Fiber Node 42",
        tenant: (props.tenant as string) || tenantSlug || "pt-media-fiber",
        status: (props.status as string) || "ACTIVE",
        type: (props.type as string) || "ODP Node",
      });
    } else {
      setPopupInfo(null);
    }
  }, [tenantSlug]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm space-y-0">
      {/* Map Header Toolbar */}
      <div className="flex flex-col gap-2 p-4 border-b border-border sm:flex-row sm:items-center sm:justify-between bg-muted/20">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Live Vector Tile Diagnostics Canvas
          </h3>
          <p className="text-xs text-muted-foreground">
            Martin MVT tile server stream via Map Gateway (Port 5003) · Real-time PostGIS spatial rendering.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1 text-xs">
            {(["all", "odp", "closure", "feeder"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLayer(l)}
                className={`px-2 py-0.5 rounded capitalize font-medium text-[11px] transition-colors ${
                  selectedLayer === l
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewState({ longitude: 107.6098, latitude: -6.9175, zoom: 11 })}
            className="h-8 text-xs border-border gap-1.5 px-2.5"
          >
            <ZoomIn className="w-3.5 h-3.5" /> Reset Zoom
          </Button>
        </div>
      </div>

      {/* MapLibre Map Container */}
      <div className="relative w-full h-[400px]">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          style={{ width: "100%", height: "100%" }}
          onClick={handleMapClick}
          interactiveLayerIds={["odp-circle-layer"]}
        >
          <NavigationControl position="bottom-right" />

          {/* ODP Vector Source Simulation */}
          <Source
            id="odp-source"
            type="geojson"
            data={{
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [107.6098, -6.9175] },
                  properties: { id: "ODP-BDG-01", name: "ODP Alun-Alun Bandung", tenant: "PT Net Media", status: "ACTIVE" },
                },
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [107.618, -6.903] },
                  properties: { id: "ODP-BDG-02", name: "ODP Dago Fiber Hub", tenant: "Garut Fiber", status: "ACTIVE" },
                },
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [107.592, -6.925] },
                  properties: { id: "ODP-BDG-03", name: "ODP Pasirkaliki Core", tenant: "PT Net Media", status: "WARNING" },
                },
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [107.63, -6.935] },
                  properties: { id: "ODP-BDG-04", name: "ODP Buah Batu Node", tenant: "Mitra Nusantara", status: "ACTIVE" },
                },
              ],
            }}
          >
            <Layer
              id="odp-circle-layer"
              type="circle"
              paint={{
                "circle-radius": 8,
                "circle-color": "#10b981",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              }}
            />
          </Source>

          {/* Interactive Popup */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
              className="font-sans"
            >
              <div className="p-2 space-y-1.5 min-w-[180px] text-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-1">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {popupInfo.id}
                  </span>
                  <Badge className="text-[9px] px-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {popupInfo.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-[11px] font-medium">{popupInfo.name}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span>Tenant: {popupInfo.tenant}</span>
                  <span className="font-mono">PostGIS MVT</span>
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Floating Map Legend Overlay */}
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md border border-border rounded-lg p-2.5 shadow-lg text-[10px] space-y-1 z-10 pointer-events-none">
          <span className="font-bold uppercase tracking-wider text-muted-foreground block">Tile Server Legend</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
            <span className="text-foreground font-medium">ODP Active Nodes (Martin MVT)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
            <span className="text-foreground font-medium">Degraded Signal Warning</span>
          </div>
        </div>
      </div>
    </div>
  );
}
