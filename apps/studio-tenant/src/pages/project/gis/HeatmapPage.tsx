import * as React from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Flame,
  Info,
} from "lucide-react";
import { Badge, PageHeader, TierQuotaGuard, useTheme } from "@k2net/ui";
import {
  maplibregl,
  MAP_COLORS,
  getBasemapStyle,
  createTenantMvtSource,
  FTTH_HEATMAP_LAYERS,
} from "@k2net/map";
import { useMapStore } from "../../../store/map-store";
import { useTenantSubscription } from "../../../hooks/useTenantSubscription";
import { useTranslation } from "@k2net/i18n";

export function HeatmapPage() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const params = useParams({ strict: false }) as { projectId?: string };
  const navigate = useNavigate();
  const projectId = params?.projectId || "";
  const { canAccessHeatmap, tier } = useTenantSubscription();

  const mapContainer = React.useRef<HTMLDivElement>(null);
  const mapInstance = React.useRef<maplibregl.Map | null>(null);
  const popupRef = React.useRef<maplibregl.Popup | null>(null);
  const { mapCenter, setMapCenter } = useMapStore();

  React.useEffect(() => {
    if (!canAccessHeatmap || !mapContainer.current || mapInstance.current) return;

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

      // Add Optical Attenuation Heatmap Layer
      if (!map.getLayer(FTTH_HEATMAP_LAYERS.heatmap.id)) {
        map.addLayer(FTTH_HEATMAP_LAYERS.heatmap);
      }

      // Add Individual Customer ONT Circle Points for High-Zoom Inspection
      if (!map.getLayer(FTTH_HEATMAP_LAYERS.points.id)) {
        map.addLayer(FTTH_HEATMAP_LAYERS.points);
      }

      // Interactive popup inspector on customer ONT points
      map.on("mouseenter", FTTH_HEATMAP_LAYERS.points.id, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", FTTH_HEATMAP_LAYERS.points.id, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("click", FTTH_HEATMAP_LAYERS.points.id, (e) => {
        if (!e.features || e.features.length === 0) return;
        const f = e.features[0];
        const props = f.properties || {};
        const coordinates = e.lngLat;

        if (popupRef.current) popupRef.current.remove();

        const code = props.code || f.id || "ONT-NODE";
        const signalDb = props.signal_db !== undefined && props.signal_db !== null
          ? Number(props.signal_db).toFixed(1)
          : "-19.5";
        const address = props.address || "";
        const numericDb = Number(signalDb);
        const status = numericDb >= -20 ? "OPTIMAL" : numericDb >= -25 ? "WARNING" : "CRITICAL";
        const statusColor = status === "OPTIMAL"
          ? MAP_COLORS.signalGood
          : status === "WARNING"
          ? MAP_COLORS.signalWarning
          : MAP_COLORS.signalCritical;

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; font-size: 11px; padding: 4px; min-width: 150px; color: #09090b;">
            <div style="font-weight: 700; color: #2563eb; font-family: monospace;">${code}</div>
            ${address ? `<div style="font-size: 10px; color: #71717a; margin-top: 2px;">${address}</div>` : ""}
            <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 4px; border-top: 1px solid #e4e4e7;">
              <span style="color: #71717a;">Optical Rx:</span>
              <span style="font-weight: 700; font-family: monospace; color: ${statusColor};">${signalDb} dBm</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span style="color: #71717a;">Status:</span>
              <span style="font-weight: 700; color: ${statusColor}; font-size: 10px;">${status}</span>
            </div>
          </div>
        `;

        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: "240px" })
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map);
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
  }, [canAccessHeatmap, isDark, mapCenter.lat, mapCenter.lng, mapCenter.zoom, projectId, setMapCenter]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden select-none">
      <PageHeader
        breadcrumbs={[
          { label: t("nav.projects"), href: "/projects" },
          { label: "GIS Infrastructure", href: `/project/${projectId}/infrastructure/topology` },
          { label: "Heatmap" },
        ]}
        title={t("gis.map_title")}
        badge={
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-medium">
            dBm RX LIVE
          </Badge>
        }
      />

      <TierQuotaGuard
        featureName={t("gis.optical_heatmap")}
        featureDescription={t("billing.upgrade_prompt")}
        isAllowed={canAccessHeatmap}
        requiredTier="pro"
        currentTier={tier}
        onUpgradeClick={() => navigate({ to: "/billing" })}
        className="flex-1 flex flex-col p-4"
      >
        <div className="relative flex-1 w-full overflow-hidden bg-muted/20 rounded-xl border border-border/60">
          <div ref={mapContainer} className="h-full w-full" />

          {/* Heatmap Legend Box */}
          <div className="absolute top-4 left-4 z-10 w-72 rounded-xl border border-border/80 bg-card/90 p-4 shadow-lg backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-border/70 pb-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-foreground">Rx Power (dBm)</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: MAP_COLORS.signalGood }} />
                  -15 ~ -20 dBm
                </span>
                <span className="font-mono text-primary font-bold">OPTIMAL</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: MAP_COLORS.signalWarning }} />
                  -21 ~ -25 dBm
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">WARNING</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: MAP_COLORS.signalCritical }} />
                  &gt; -26 dBm (LOS)
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">CRITICAL</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                {t("gis.map_subtitle")}
              </span>
            </div>
          </div>
        </div>
      </TierQuotaGuard>
    </div>
  );
}


