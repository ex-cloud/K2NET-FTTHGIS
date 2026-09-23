import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Layers,
  Activity,
  Calculator,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button, Badge, PageHeader } from "@k2net/ui";
import { maplibregl, MAP_COLORS, calculateOpticalAttenuation } from "@k2net/map";
import { useMapStore } from "../../../store/map-store";

export function TopologyPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  const mapContainer = React.useRef<HTMLDivElement>(null);
  const mapInstance = React.useRef<maplibregl.Map | null>(null);

  const { layerVisibility, setLayerVisibility, mapCenter, setMapCenter } = useMapStore();
  const [showSimModal, setShowSimModal] = React.useState(false);
  const [simKm, setSimKm] = React.useState(4.5);

  const attenuationResult = calculateOpticalAttenuation({
    fiberLengthKm: simKm,
    spliceCount: 4,
    connectorCount: 2,
    splitterRatios: [8, 8],
  });

  React.useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap Contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [mapCenter.lng, mapCenter.lat],
      zoom: mapCenter.zoom,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.on("moveend", () => {
      const c = map.getCenter();
      setMapCenter({ lng: c.lng, lat: c.lat, zoom: map.getZoom() });
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [mapCenter.lat, mapCenter.lng, mapCenter.zoom, setMapCenter]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden select-none">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "GIS Infrastructure", href: `/project/${projectId}/infrastructure/topology` },
          { label: "Topologi Peta" },
        ]}
        title="Topologi Jaringan Spasial GIS"
        badge={
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-medium">
            MARTIN MVT LIVE
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSimModal(!showSimModal)}
              className="h-8 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer rounded-md"
            >
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <span>Simulasi Redaman</span>
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs">
              <MapPin className="h-3.5 w-3.5" />
              <span>+ Pasang Aset Baru</span>
            </Button>
          </div>
        }
      />

      {/* Full-Bleed Map Canvas Area */}
      <div className="relative flex-1 w-full overflow-hidden bg-muted/20">
        <div ref={mapContainer} className="h-full w-full" />

        {/* Floating Layer Control */}
        <div className="absolute top-4 left-4 z-10 w-64 rounded-xl border border-border/80 bg-card/90 p-3.5 shadow-lg backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between border-b border-border/70 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Layer Spasial GIS</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
              VECTOR
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div
              onClick={() => setLayerVisibility("OLT", !layerVisibility.OLT)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.oltPop }} />
                <span className="text-foreground font-medium">OLT Core Devices</span>
              </div>
              {layerVisibility.OLT ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>

            <div
              onClick={() => setLayerVisibility("ODC", !layerVisibility.ODC)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.odcClosure }} />
                <span className="text-foreground font-medium">ODC Cabinets</span>
              </div>
              {layerVisibility.ODC ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>

            <div
              onClick={() => setLayerVisibility("ODP", !layerVisibility.ODP)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.odpFatBox }} />
                <span className="text-foreground font-medium">ODP FAT Boxes</span>
              </div>
              {layerVisibility.ODP ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>

            <div
              onClick={() => setLayerVisibility("CABLE", !layerVisibility.CABLE)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.backboneCable }} />
                <span className="text-foreground font-medium">Kabel Fiber Optik</span>
              </div>
              {layerVisibility.CABLE ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>

            <div
              onClick={() => setLayerVisibility("CUSTOMER", !layerVisibility.CUSTOMER)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                <span className="text-foreground font-medium">Pelanggan / Homepass</span>
              </div>
              {layerVisibility.CUSTOMER ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </div>
        </div>

        {/* Floating Simulation Panel */}
        {showSimModal && (
          <div className="absolute top-4 right-16 z-20 w-80 rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-primary" />
                Kalkulator Redaman Optik
              </span>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Panjang Fiber (km):</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="30"
                  value={simKm}
                  onChange={(e) => setSimKm(Number(e.target.value))}
                  className="w-20 rounded border border-border bg-background px-2 py-1 text-right text-foreground font-mono"
                />
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Fiber Loss (0.35dB/km):</span>
                <span className="text-foreground font-bold font-mono">{attenuationResult.fiberLossDb} dB</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Splitter (1:8 + 1:8):</span>
                <span className="text-foreground font-bold font-mono">{attenuationResult.splitterLossDb} dB</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="font-bold text-foreground">Total Estimasi Loss:</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    attenuationResult.isWithinStandard ? "text-primary" : "text-destructive"
                  }`}
                >
                  {attenuationResult.totalLossDb} dB
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Status Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/90 px-4 py-2.5 shadow-lg backdrop-blur-xl text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="font-medium">MapLibre Engine</span>
            <span>·</span>
            <span className="font-medium">Martin MVT PostGIS</span>
            <span>·</span>
            <span className="text-primary font-medium flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> Ready for Geospatial Queries
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
