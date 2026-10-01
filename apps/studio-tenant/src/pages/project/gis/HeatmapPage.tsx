import * as React from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Flame,
  Info,
} from "lucide-react";
import { Badge, PageHeader, TierQuotaGuard } from "@k2net/ui";
import { maplibregl } from "@k2net/map";
import { useMapStore } from "../../../store/map-store";
import { useTenantSubscription } from "../../../hooks/useTenantSubscription";
import { useTranslation } from "@k2net/i18n";

export function HeatmapPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const navigate = useNavigate();
  const projectId = params?.projectId || "proj-bdg-01";
  const { canAccessHeatmap, tier } = useTenantSubscription();

  const mapContainer = React.useRef<HTMLDivElement>(null);
  const mapInstance = React.useRef<maplibregl.Map | null>(null);
  const { mapCenter } = useMapStore();

  React.useEffect(() => {
    if (!canAccessHeatmap || !mapContainer.current || mapInstance.current) return;

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
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [canAccessHeatmap, mapCenter.lat, mapCenter.lng, mapCenter.zoom]);

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
        featureName="Heatmap Redaman Optik"
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
                  <span className="h-3 w-3 rounded bg-primary" />
                  -15 ~ -20 dBm
                </span>
                <span className="font-mono text-primary font-bold">OPTIMAL</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-amber-500" />
                  -21 ~ -25 dBm
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">WARNING</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-rose-500" />
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

