

import React, { useState, useCallback, useEffect } from "react";
import Map, { Source, Layer, NavigationControl, Popup } from "@k2net/map";
import { Badge, Button } from "@k2net/ui";
import {
  MapPin,
  RefreshCw,
  Layers,
  ZoomIn,
  ClipboardList,
  X,
  ExternalLink,
  User,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useRouter } from "@/lib/navigation-compat";
import { useSession } from '@/lib/auth-compat';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';

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
  const { data: session } = useSession();
  const router = useRouter();
  const [viewState, setViewState] = useState({
    longitude: 107.6098,
    latitude: -6.9175, // Bandung / Indonesia center
    zoom: 11,
  });

  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedLayer, setSelectedLayer] = useState<"all" | "odp" | "odc" | "fiber_cable" | "customer">("all");

  const [tasksGeoJson, setTasksGeoJson] = useState<any>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Fetch live tasks GeoJSON data from Phase 2 endpoint
  const fetchTasks = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoadingTasks(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/geojson`, { token: session.accessToken });
      if (res.ok) {
        const data = await res.json();
        setTasksGeoJson(data);
      }
    } catch (err) {
      console.error("Gagal memuat GeoJSON tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle layer/referenceType filtering
  const filteredTasks = React.useMemo(() => {
    if (!tasksGeoJson) return null;
    if (selectedLayer === "all") return tasksGeoJson;

    const filteredFeatures = tasksGeoJson.features.filter((f: any) => {
      const refType = f.properties?.referenceType;
      if (!refType) return false;
      return refType.toLowerCase() === selectedLayer.toLowerCase();
    });

    return {
      type: "FeatureCollection",
      features: filteredFeatures,
    };
  }, [tasksGeoJson, selectedLayer]);

  const handleMapClick = useCallback(
    (event: any) => {
      if (event.features && event.features.length > 0) {
        const feature = event.features[0];
        const layerId = feature.layer.id;
        const props = feature.properties || {};

        if (layerId === "tasks-circle-layer") {
          setPopupInfo(null);
          setSelectedTask(props);
        } else {
          setSelectedTask(null);
          setPopupInfo({
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
            id: props.id || props.code || "ODP-BDG-042",
            name: props.name || "ODP Fiber Node 42",
            tenant: props.tenant || tenantSlug || "pt-media-fiber",
            status: props.status || "ACTIVE",
            type: props.type || "ODP Node",
          });
        }
      } else {
        setPopupInfo(null);
        setSelectedTask(null);
      }
    },
    [tenantSlug]
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm space-y-0">
      {/* Map Header Toolbar */}
      <div className="flex flex-col gap-2 p-4 border-b border-border sm:flex-row sm:items-center sm:justify-between bg-muted/20">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Live GIS & Task Explorer Canvas
          </h3>
          <p className="text-xs text-muted-foreground">
            Martin MVT tile stream & Task geolocations (SRID 4326) · Real-time PostGIS spatial rendering.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1 text-xs">
            {(["all", "odp", "odc", "fiber_cable", "customer"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLayer(l)}
                className={`px-2 py-0.5 rounded capitalize font-medium text-[11px] transition-colors ${
                  selectedLayer === l
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l === "all" ? "All Layers" : l.replace("_", " ")}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={loadingTasks}
            className="h-8 text-xs border-border gap-1.5 px-2.5"
            title="Reload Tasks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingTasks ? "animate-spin text-primary" : ""}`} />
          </Button>

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

      {/* Map + Detail Panel container */}
      <div className="flex flex-col md:flex-row w-full h-[450px]">
        {/* MapLibre Map Container */}
        <div className="flex-1 relative h-full">
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            mapStyle="https://tiles.openfreemap.org/styles/liberty"
            style={{ width: "100%", height: "100%" }}
            onClick={handleMapClick}
            interactiveLayerIds={["odp-circle-layer", "tasks-circle-layer"]}
          >
            <NavigationControl position="bottom-right" />

            {/* ODP Vector Source Simulation */}
            {selectedLayer === "all" || selectedLayer === "odp" ? (
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
            ) : null}

            {/* Tasks Point GeoJSON Layer (Phase 2) */}
            {filteredTasks && (
              <Source id="tasks-source" type="geojson" data={filteredTasks}>
                <Layer
                  id="tasks-circle-layer"
                  type="circle"
                  paint={{
                    "circle-radius": 9,
                    "circle-color": [
                      "match",
                      ["get", "priority"],
                      "URGENT", "#ef4444",
                      "HIGH", "#f97316",
                      "NORMAL", "#3b82f6",
                      "#9ca3af"
                    ],
                    "circle-stroke-width": 2.5,
                    "circle-stroke-color": "#ffffff",
                  }}
                />
              </Source>
            )}

            {/* Interactive ODP/Closure Popup */}
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
                    <Badge className="text-[9px] px-1 bg-primary/10 text-primary border-primary/20">
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
              <span className="w-2.5 h-2.5 rounded-full bg-primary border border-white" />
              <span className="text-foreground font-medium">ODP Active Nodes (MVT)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
              <span className="text-foreground font-medium">Tasks / Ticket Pins</span>
            </div>
          </div>
        </div>

        {/* Task Details Side Panel (Fase 2 Slide-in) */}
        {selectedTask && (
          <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-border bg-card p-5 flex flex-col justify-between overflow-y-auto shrink-0 h-full">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/75 dark:text-muted-foreground flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Task Details
                </h4>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title & Classification */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    {selectedTask.type}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                    selectedTask.priority === "URGENT"
                      ? "text-destructive bg-destructive/10"
                      : selectedTask.priority === "HIGH"
                      ? "text-orange-500 bg-orange-500/10"
                      : "text-muted-foreground bg-muted"
                  }`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground leading-snug">
                  {selectedTask.title}
                </h3>
                {selectedTask.obsidianRef && (
                  <p className="text-xs font-mono text-primary">
                    Ref: {selectedTask.obsidianRef}
                  </p>
                )}
              </div>

              {/* Attributes block */}
              <div className="space-y-2.5 pt-3 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/75 dark:text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/60" /> Status
                  </span>
                  <span className="font-semibold text-foreground">{selectedTask.status}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-foreground/75 dark:text-muted-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground/60" /> Assignee
                  </span>
                  <span className="font-medium text-foreground">{selectedTask.assigneeId || "Belum ditugaskan"}</span>
                </div>

                {selectedTask.referenceId && (
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground/75 dark:text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" /> Ref GIS
                    </span>
                    <span className="font-medium text-foreground font-mono text-[11px]">
                      {selectedTask.referenceType}: {selectedTask.referenceId}
                    </span>
                  </div>
                )}

                {selectedTask.dueDate && (
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground/75 dark:text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/60" /> Tenggat
                    </span>
                    <span className="font-medium text-foreground">
                      {new Date(selectedTask.dueDate).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                )}
              </div>

              {/* Obsidian deep-link */}
              {selectedTask.type === "PROJECT" && selectedTask.obsidianRef && (
                <a
                  href={`obsidian://open?vault=K2NET_Engineering_Vault&file=${selectedTask.obsidianRef}`}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-all group"
                  title="Membutuhkan Obsidian Desktop terpasang di PC Anda"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-primary" /> Open in Obsidian
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
            </div>

            {/* View Full details Button */}
            <div className="pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs h-9 justify-center"
                onClick={() => router.push(`/tasks/${selectedTask.id}`)}
              >
                View Full Details <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
