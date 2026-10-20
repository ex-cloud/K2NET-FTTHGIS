import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Layers,
  Activity,
  Calculator,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button, Badge, PageHeader, useTheme } from "@k2net/ui";
import {
  maplibregl,
  MAP_COLORS,
  calculateOpticalAttenuation,
  getBasemapStyle,
  createTenantMvtSource,
  FTTH_VECTOR_LAYERS,
} from "@k2net/map";
import { useMapStore } from "../../../store/map-store";
import { useTranslation } from "@k2net/i18n";

export function TopologyPage() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "";

  const mapContainer = React.useRef<HTMLDivElement>(null);
  const mapInstance = React.useRef<maplibregl.Map | null>(null);
  const popupRef = React.useRef<maplibregl.Popup | null>(null);

  const { layerVisibility, setLayerVisibility, mapCenter, setMapCenter } = useMapStore();
  const [showSimModal, setShowSimModal] = React.useState(false);
  const [simKm, setSimKm] = React.useState(4.5);

  const attenuationResult = calculateOpticalAttenuation({
    fiberLengthKm: simKm,
    spliceCount: 4,
    connectorCount: 2,
    splitterRatios: [8, 8],
  });

  // 1. Initialize MapLibre with Centralized Basemap & Martin MVT Vector Source
  React.useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const basemapStyle = getBasemapStyle({
      theme: isDark ? "dark" : "light",
    });

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: basemapStyle,
      center: [mapCenter.lng, mapCenter.lat],
      zoom: mapCenter.zoom,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.on("load", () => {
      // Add dynamic Martin MVT Vector Source scoped to tenant & project
      if (!map.getSource("martin-mvt")) {
        map.addSource("martin-mvt", createTenantMvtSource({
          projectId,
        }));
      }

      // Add PostGIS Vector Layers (Edges first, then Nodes)
      if (!map.getLayer(FTTH_VECTOR_LAYERS.cables.id)) {
        map.addLayer(FTTH_VECTOR_LAYERS.cables);
      }
      if (!map.getLayer(FTTH_VECTOR_LAYERS.customer.id)) {
        map.addLayer(FTTH_VECTOR_LAYERS.customer);
      }
      if (!map.getLayer(FTTH_VECTOR_LAYERS.odp.id)) {
        map.addLayer(FTTH_VECTOR_LAYERS.odp);
      }
      if (!map.getLayer(FTTH_VECTOR_LAYERS.odc.id)) {
        map.addLayer(FTTH_VECTOR_LAYERS.odc);
      }
      if (!map.getLayer(FTTH_VECTOR_LAYERS.olt.id)) {
        map.addLayer(FTTH_VECTOR_LAYERS.olt);
      }

      // Interactive hover & click popup inspector
      const interactiveLayers = [
        FTTH_VECTOR_LAYERS.olt.id,
        FTTH_VECTOR_LAYERS.odc.id,
        FTTH_VECTOR_LAYERS.odp.id,
        FTTH_VECTOR_LAYERS.customer.id,
        FTTH_VECTOR_LAYERS.cables.id,
      ];

      interactiveLayers.forEach((layerId) => {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("click", layerId, (e) => {
          if (!e.features || e.features.length === 0) return;
          const f = e.features[0];
          const props = f.properties || {};
          const coordinates = e.lngLat;

          if (popupRef.current) popupRef.current.remove();

          const type = props.node_type || props.cable_type || "Asset";
          const code = props.code || f.id || "N/A";
          const name = props.name || "";
          const status = props.status || "ACTIVE";

          const popupContent = `
            <div style="font-family: system-ui, sans-serif; font-size: 11px; padding: 4px; min-width: 140px; color: #09090b;">
              <div style="font-weight: 700; color: #2563eb; font-family: monospace;">${code}</div>
              ${name ? `<div style="font-weight: 600; margin-top: 2px;">${name}</div>` : ""}
              <div style="display: flex; justify-content: space-between; margin-top: 4px; color: #71717a;">
                <span>Type:</span>
                <span style="font-weight: 600; color: #18181b;">${type}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 2px; color: #71717a;">
                <span>Status:</span>
                <span style="font-weight: 600; color: ${status === "ACTIVE" ? "#16a34a" : "#ca8a04"};">${status}</span>
              </div>
            </div>
          `;

          popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: "240px" })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
        });
      });
    });

    map.on("moveend", () => {
      const c = map.getCenter();
      setMapCenter({ lng: c.lng, lat: c.lat, zoom: map.getZoom() });
    });

    mapInstance.current = map;

    return () => {
      if (popupRef.current) popupRef.current.remove();
      map.remove();
      mapInstance.current = null;
    };
  }, [projectId, isDark, mapCenter.lat, mapCenter.lng, mapCenter.zoom, setMapCenter]);

  // 2. Synchronize Layer Visibility Control with MapLibre
  React.useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const toggle = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
      }
    };

    toggle(FTTH_VECTOR_LAYERS.cables.id, layerVisibility.CABLE);
    toggle(FTTH_VECTOR_LAYERS.olt.id, layerVisibility.OLT);
    toggle(FTTH_VECTOR_LAYERS.odc.id, layerVisibility.ODC);
    toggle(FTTH_VECTOR_LAYERS.odp.id, layerVisibility.ODP);
    toggle(FTTH_VECTOR_LAYERS.customer.id, layerVisibility.CUSTOMER);
  }, [layerVisibility]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden select-none">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: t("nav.projects"), href: "/projects" },
          { label: "GIS Infrastructure", href: `/project/${projectId}/infrastructure/topology` },
          { label: "Topology" },
        ]}
        title={t("gis.map_title")}
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
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer rounded-md"
            >
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <span>{t("inventory.attenuation")}</span>
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
              <span className="text-xs font-bold text-foreground">{t("gis.layers")}</span>
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
                <span className="text-foreground font-medium">{t("gis.layer_olts")}</span>
              </div>
              {layerVisibility.OLT ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>

            <div
              onClick={() => setLayerVisibility("ODC", !layerVisibility.ODC)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.odcClosure }} />
                <span className="text-foreground font-medium">{t("gis.layer_odcs")}</span>
              </div>
              {layerVisibility.ODC ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>

            <div
              onClick={() => setLayerVisibility("ODP", !layerVisibility.ODP)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.odpFatBox }} />
                <span className="text-foreground font-medium">{t("gis.layer_odps")}</span>
              </div>
              {layerVisibility.ODP ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>

            <div
              onClick={() => setLayerVisibility("CABLE", !layerVisibility.CABLE)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.backboneCable }} />
                <span className="text-foreground font-medium">{t("gis.layer_cables")}</span>
              </div>
              {layerVisibility.CABLE ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>

            <div
              onClick={() => setLayerVisibility("CUSTOMER", !layerVisibility.CUSTOMER)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MAP_COLORS.customerOnt }} />
                <span className="text-foreground font-medium">{t("inventory.customer_title")}</span>
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
                {t("inventory.attenuation")}
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
                <span className="text-muted-foreground font-medium">{t("inventory.length_meters")}:</span>
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
                <span className="font-bold text-foreground">Total Loss:</span>
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
            <span className="font-medium">MapLibre GL JS</span>
            <span>·</span>
            <span className="font-medium">Martin MVT PostGIS</span>
            <span>·</span>
            <span className="text-primary font-medium flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> Vector Pipeline Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
