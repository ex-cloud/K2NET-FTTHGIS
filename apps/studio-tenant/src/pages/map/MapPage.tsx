import { useEffect, useRef, useState } from "react";
import { Layers, Activity, Calculator, MapPin } from "lucide-react";
import { Button, Badge, PageHeader } from "@k2net/ui";
import { maplibregl, MAP_COLORS, calculateOpticalAttenuation } from "@k2net/map";

export function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [activeLayers, setActiveLayers] = useState({
    backbone: true,
    distribution: true,
    odc: true,
    odp: true,
  });
  const [showSimModal, setShowSimModal] = useState(false);
  const [simKm, setSimKm] = useState(4.5);

  const attenuationResult = calculateOpticalAttenuation({
    fiberLengthKm: simKm,
    spliceCount: 4,
    connectorCount: 2,
    splitterRatios: [8, 8], // 1:8 ODC + 1:8 ODP FAT
  });

  useEffect(() => {
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
      center: [106.8456, -6.2088], // Jakarta default center
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: "Portal Tenant", href: "/" },
          { label: "Peta Spasial GIS" },
        ]}
        title="Peta Spasial Fiber Optik & Topologi Jaringan"
        badge={
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-medium">
            MVT LIVE POSTGIS
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSimModal(!showSimModal)}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer rounded-md border-border text-foreground hover:bg-muted"
            >
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <span>Simulasi Redaman</span>
            </Button>
            <Button
              size="sm"
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer rounded-md"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Tarik Kabel Baru</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. Full-Bleed Map Canvas Area ─────────────────────────── */}
      <div className="relative flex-1 w-full overflow-hidden bg-muted/20">
        {/* MapLibre WebGL Canvas Container */}
        <div ref={mapContainer} className="h-full w-full" />

        {/* Floating Left Layer Control Panel */}
        <div className="absolute top-4 left-4 z-10 w-64 rounded-xl border border-border/80 bg-card/90 p-4 shadow-lg backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between border-b border-border/70 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Layer Spasial GIS</span>
            </div>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[9px] font-mono">
              VECTOR
            </Badge>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.backboneCable }} />
                <span className="text-foreground font-medium">Kabel Backbone</span>
              </div>
              <input
                type="checkbox"
                checked={activeLayers.backbone}
                onChange={() => toggleLayer("backbone")}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.distributionCable }} />
                <span className="text-foreground font-medium">Kabel Distribusi</span>
              </div>
              <input
                type="checkbox"
                checked={activeLayers.distribution}
                onChange={() => toggleLayer("distribution")}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.odcClosure }} />
                <span className="text-foreground font-medium">ODC (Closure)</span>
              </div>
              <input
                type="checkbox"
                checked={activeLayers.odc}
                onChange={() => toggleLayer("odc")}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.odpFatBox }} />
                <span className="text-foreground font-medium">ODP (FAT Port)</span>
              </div>
              <input
                type="checkbox"
                checked={activeLayers.odp}
                onChange={() => toggleLayer("odp")}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
            </label>
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
              <div className="flex justify-between text-muted-foreground">
                <span>Splice + Connector:</span>
                <span className="text-foreground font-bold font-mono">
                  {(attenuationResult.spliceLossDb + attenuationResult.connectorLossDb).toFixed(2)} dB
                </span>
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

        {/* Floating Bottom Status Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/90 px-4 py-2.5 shadow-lg backdrop-blur-xl text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="font-medium">Engine: MapLibre GL v5</span>
            <span>·</span>
            <span className="font-medium">Tile Source: Martin PostGIS MVT</span>
            <span>·</span>
            <span className="text-primary font-medium flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> Ready for Geospatial Queries
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSimModal(!showSimModal)}
              className="h-7 px-2.5 text-[11px] border-border text-foreground cursor-pointer gap-1"
            >
              <Calculator className="h-3 w-3 text-primary" />
              <span>Simulasi Redaman Fiber</span>
            </Button>
            <Button size="sm" className="h-7 px-2.5 text-[11px] rounded-md font-medium cursor-pointer shadow-xs">
              Tarik Kabel Baru
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
