"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { MapTooltip, type HoveredFeature } from "@/components/dashboard/map-tooltip";
import { useTracePath } from "@/hooks/use-trace-path";
import Map, {
  Source,
  Layer,
  ScaleControl,
  MapRef,
  Marker,
} from "react-map-gl/maplibre";
import { useSearchParams, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { networkApi } from "@/lib/api/network";
import type {
  CircleLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
  HeatmapLayerSpecification,
  FillLayerSpecification,
  StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turfUtils from "@/lib/turf-utils";
import { FeatureCollection, Feature } from "geojson";
import { useTheme } from "next-themes";
import { useMapStore } from "@/store/map-store";
import { useSelectionStore } from "@/store/selection-store";
import { getMartinBaseUrl } from "@/lib/api-config";
import { MapLayerMouseEvent } from "maplibre-gl";
import {
  Plus,
  Minus,
  Crosshair,
  MousePointer2,
  PenTool,
  GitCommit,
  Cable,
  Box,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapNotifications } from "@/hooks/use-map-notifications";
import { MapDrawControl } from "@/components/map/map-draw-control";
import { MapFilterControl } from "@/components/dashboard/map-filter-control";
import { AssetFormSidebar } from "@/components/dashboard/asset-form-sidebar";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { DrawAssetType } from "@/store/map-store";

// Default viewport centered on Bandung (based on seeder data)
const INITIAL_VIEW_STATE = {
  longitude: 107.6191,
  latitude: -6.9175,
  zoom: 13,
};

// OpenFreeMap Styles (100% Free, No Token Required)
const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/bright",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

// Pure Black Style for Topology Mode (Complete schematic view)
const TOPOLOGY_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#0a0a0f" },
    },
  ],
};

interface NetworkMapProps {
  allowEditing?: boolean;
}

export function NetworkMap({ allowEditing = false }: NetworkMapProps = {}) {
  const mapRef = useRef<MapRef>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useMapNotifications(); // Initialize Real-time SSE Connection
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const focusCode = searchParams.get("focus");
  const { selectedAsset, setSelectedAsset } = useSelectionStore();
  const {
    mapCenter,
    setMapCenter,
    mapStyle,
    statusOverrides,
    isEditMode,
    setIsEditMode,
    drawingAssetType,
    setDrawingAssetType,
    isFormOpen,
    setIsFormOpen,
    setDrawnFeature,
    tileRefreshKey,
    triggerTileRefresh,
    setEditingAsset,
    // Trace Path state
    traceMode,
    traceSourceNode,
    tracedPath,
    setTracedPath,
    clearTrace,
    // Layer Visibility
    layerVisibility,
  } = useMapStore();
  
  const [dashOffset, setDashOffset] = useState(0);

  // Trace Path hook
  const { fetchTracePath, loading: traceLoading } = useTracePath();

  const params = useParams();
  const orgSlug = params?.orgId as string;
  const projectId = params?.projectId as string;

  // Hover tooltip state
  const [hoveredFeature, setHoveredFeature] = useState<HoveredFeature | null>(null);

  // Use a more specific type than 'any' but avoid 'never' issues with constructor/instance confusion
  const drawRef = useRef<MapboxDraw | null>(null);

  const onDrawCreate = React.useCallback(
    (e: { features: Feature[] }) => {
      setDrawnFeature(e.features[0]);
      setIsFormOpen(true);
    },
    [setDrawnFeature, setIsFormOpen],
  );

  const onDrawUpdate = React.useCallback(
    (e: { features: Feature[]; action: string }) => {
      setDrawnFeature(e.features[0]);
      setIsFormOpen(true);
    },
    [setDrawnFeature, setIsFormOpen],
  );

  const onDrawDelete = React.useCallback(() => {
    setDrawnFeature(null);
    setIsFormOpen(false);
  }, [setDrawnFeature, setIsFormOpen]);

  const startDrawing = React.useCallback(
    (type: DrawAssetType, mode: string) => {
      if (!drawRef.current) return;
      setIsEditMode(true);
      setDrawingAssetType(type);
      drawRef.current.changeMode(mode);
    },
    [setIsEditMode, setDrawingAssetType],
  );

  // Derived state for cleaner mode checks
  const isTopologyMode = mapStyle === "topology";
  const isSatelliteMode = mapStyle === "satellite";

  const coverageData = useMemo<Feature | null>(() => {
    if (
      !selectedAsset?.lng ||
      !selectedAsset?.lat ||
      selectedAsset.type !== "ODP"
    ) {
      return null;
    }
    return turfUtils.createBuffer(
      selectedAsset.lng,
      selectedAsset.lat,
      50,
    ) as Feature;
  }, [selectedAsset]);

  const heatmapData = useMemo<FeatureCollection | null>(() => {
    if (
      !selectedAsset?.lng ||
      !selectedAsset?.lat ||
      (selectedAsset.type !== "ODP" && selectedAsset.type !== "CUSTOMER")
    ) {
      return null;
    }
    return turfUtils.createSignalHeatmapData(
      selectedAsset.lng,
      selectedAsset.lat,
      selectedAsset.signalDb || -20,
    );
  }, [selectedAsset]);

  // Watch mapCenter changes (e.g. from Search) and fly there
  useEffect(() => {
    if (!mapRef.current) return;

    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();

    const dist = Math.sqrt(
      Math.pow(currentCenter.lng - mapCenter.lng, 2) +
        Math.pow(currentCenter.lat - mapCenter.lat, 2),
    );

    if (dist > 0.0001 || Math.abs(currentZoom - mapCenter.zoom) > 0.1) {
      mapRef.current.flyTo({
        center: [mapCenter.lng, mapCenter.lat],
        zoom: mapCenter.zoom,
        duration: 2000,
        essential: true,
      });
    }
  }, [mapCenter]);

  // Handle URL Focus Parameter
  useEffect(() => {
    if (!focusCode || !session?.accessToken || !mounted) return;

    const handleFocus = async () => {
      try {
        const results = await networkApi.searchAssets(focusCode, "", session.accessToken as string);
          // Take the exact match or first result
          const asset = results.find((r: { code: string }) => r.code === focusCode) || results[0];
          
          if (asset) {
            // Set as selected to open side panel
            setSelectedAsset({
              id: asset.id,
              type: asset.type,
              code: asset.code,
              lng: asset.lng,
              lat: asset.lat,
              status: asset.status,
            });

            // Fly to location
            setMapCenter({
                lng: asset.lng,
                lat: asset.lat,
                zoom: 18, // Zoom in close for focus
            });
          }
        } catch (err) {
          console.error("Failed to focus on asset from URL", err);
        }
      };

    handleFocus();
  }, [focusCode, session?.accessToken, mounted, setSelectedAsset, setMapCenter]);

  // Compute base map style based on mode
  const currentMapStyle = useMemo(() => {
    let style: StyleSpecification | string;
    if (isTopologyMode) {
      style = TOPOLOGY_STYLE;
    } else {
      style = theme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
    }

    // Inject our custom sprite into the style if it's a string (URL)
    // MapLibre can take a style object with a sprite property
    if (typeof style === "string") {
      return style; // OpenFreeMap handles its own sprites, but we might want to override
    }

    return style;
  }, [theme, isTopologyMode]);

  // Manual Icon Loader
  // --- ICON LOADING ENGINE ---
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    
    // The most reliable way to load images in MapLibre is listening to styleimagemissing
    const handleMissingImage = async (e: { id: string }) => {
      const id = e.id;
      // Predefined icons we expect
      const validIcons = ["olt", "odc", "odp", "customer", "splitter", "closure", "pole"];
      
      if (validIcons.includes(id)) {
        try {
          const image = await map.loadImage(`/icons/${id}.svg`);
          if (image && !map.hasImage(id)) {
            map.addImage(id, image.data);
          }
        } catch (error) {
          console.error(`Failed to load icon: ${id}`, error);
        }
      }
    };

    map.on('styleimagemissing', handleMissingImage);

    return () => {
      map.off('styleimagemissing', handleMissingImage);
    };
  }, [currentMapStyle, mounted]);

  const onMapLoad = useCallback(async () => {
    // Initial load handled by useEffect above for better style-switch recovery
    console.log("Map engine loaded successfully");
  }, []);

  // Fix for hydration mismatch (Client-side only mount)
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Real-time status update via tile refresh (debounced)
  useEffect(() => {
    if (!mapRef.current || !mounted) return;

    // Debounced tile refresh when status changes
    if (Object.keys(statusOverrides).length > 0) {
      const timeoutId = setTimeout(() => {
        triggerTileRefresh();
      }, 2000); // 2 second debounce to avoid flickering

      return () => clearTimeout(timeoutId);
    }
  }, [statusOverrides, mounted, triggerTileRefresh]);

  // Ant-trail animation for traced path
  useEffect(() => {
    let animationFrame: number;
    if (tracedPath) {
      const animate = () => {
        setDashOffset(prev => (prev + 0.2) % 4);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [tracedPath]);

  // Sync Form Close with Draw Cleanup
  useEffect(() => {
    if (!isFormOpen && drawRef.current) {
      drawRef.current.deleteAll();
      setDrawnFeature(null);
      setDrawingAssetType(null);
      setEditingAsset(null);
    }
  }, [isFormOpen, setDrawnFeature, setDrawingAssetType, setEditingAsset]);

  const [tileTimestamp] = useState(() => Date.now());

  const mvtTileUrl = useMemo(() => {
    const baseUrl = getMartinBaseUrl();
    const safeProjectId = (projectId && projectId !== "" && projectId !== "undefined") ? projectId : "";
    // Add project_id, org_slug, timestamp and refresh key to force tile reload when needed
    // The backend uses these for multi-tenant isolation
    return `${baseUrl}/get_mvt_data/{z}/{x}/{y}?project_id=${safeProjectId}&org_slug=${orgSlug || ""}&t=${tileTimestamp}&r=${tileRefreshKey}`;
  }, [tileTimestamp, tileRefreshKey, projectId, orgSlug]);

  // Mouse hover handler for tooltip (no API calls, reads from MVT properties)
  const onMouseMove = useCallback(
    (evt: MapLayerMouseEvent) => {
      const features = evt.features;
      if (features && features.length > 0) {
        const feature = features[0];
        const sourceLayer = feature.sourceLayer;
        const type =
          sourceLayer === "nodes" ? feature.properties.node_type : "CABLE";
        setHoveredFeature({
          code: feature.properties.code || `${type}-${feature.properties.id}`,
          type,
          status: (feature.properties.code && statusOverrides[feature.properties.code]) || feature.properties.status || "PLAN",
          health_status: feature.properties.health_status || "UP",
          x: evt.point.x,
          y: evt.point.y,
        });
        // Change cursor to pointer
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = traceMode === "selecting-target" ? "crosshair" : "pointer";
        }
      } else {
        setHoveredFeature(null);
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = traceMode === "selecting-target" ? "crosshair" : "";
        }
      }
    },
    [statusOverrides, traceMode]
  );

  const onMouseLeave = useCallback(() => {
    setHoveredFeature(null);
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = traceMode === "selecting-target" ? "crosshair" : "";
    }
  }, [traceMode]);



  const onMapClick = (evt: MapLayerMouseEvent) => {
    // If actively drawing a NEW feature, don't allow selecting existing ones
    if (drawingAssetType) return;

    // TRACE MODE: selecting target node
    if (traceMode === "selecting-target" && traceSourceNode) {
      const features = evt.features;
      if (features && features.length > 0) {
        const feature = features[0];
        if (feature.sourceLayer === "nodes") {
          const targetId = feature.properties.id?.toString();
          if (targetId && targetId !== traceSourceNode.id) {
            fetchTracePath(traceSourceNode.id, targetId).then((result) => {
              if (result) {
                setTracedPath(result);
              }
            });
          }
        }
      }
      return;
    }

    const features = evt.features;
    if (features && features.length > 0) {
      const feature = features[0];
      const sourceLayer = feature.sourceLayer;

      const type =
        sourceLayer === "nodes" ? feature.properties.node_type : "CABLE";
      const id = feature.properties.id;
      const code = feature.properties.code || `${type}-${id}`;

      let lng = evt.lngLat.lng;
      let lat = evt.lngLat.lat;

      if (feature.geometry.type === "Point") {
        const coords = feature.geometry.coordinates as [number, number];
        lng = coords[0];
        lat = coords[1];
      }

      // If in edit mode, we set the editingAsset to the selected feature
      if (isEditMode && allowEditing) {
        setEditingAsset({
          id: id.toString(),
          type: type as DrawAssetType,
          code,
          properties: feature.properties,
        });

        // Set drawnFeature for the form to calculate location/length
        const drawFeature = {
          type: "Feature",
          geometry: feature.geometry,
          properties: feature.properties,
          id: feature.id || feature.properties.id || id, // ensure it has an id for Draw
        } as unknown as Feature;

        setDrawnFeature(drawFeature);
        setIsFormOpen(true);

        // Also add to Mapbox Draw to allow geometry editing
        if (drawRef.current) {
          drawRef.current.deleteAll();
          drawRef.current.add(drawFeature);
          const mode =
            feature.geometry.type === "Point"
              ? "simple_select"
              : "direct_select";
          // Cast to the expected Draw methods to satisfy TS without using 'any'
          const drawInstance = drawRef.current as unknown as { 
            changeMode: (mode: string, options?: object) => void 
          };
          drawInstance.changeMode(mode, {
            featureId: (drawFeature.id as string | number).toString(),
          });
        }
      } else {
        // Normal selection (viewing)
        setSelectedAsset({
          id: id.toString(),
          type,
          code,
          lng,
          lat,
          signalDb: feature.properties.signal_db,
          status: feature.properties.status,
          healthStatus: feature.properties.health_status,
        });
      }
    } else {
      if (!isEditMode) {
        setSelectedAsset(null);
      }
    }
  };

  const onMapMove = (evt: {
    viewState: { longitude: number; latitude: number; zoom: number };
  }) => {
    const { longitude, latitude, zoom } = evt.viewState;
    setMapCenter({ lng: longitude, lat: latitude, zoom });
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleResetView = () => {
    mapRef.current?.flyTo({
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      bearing: 0,
      pitch: 0,
      duration: 2000,
      essential: true,
    });
  };

  // ============================================================
  // LAYER DEFINITIONS
  // ============================================================

  // --- TOPOLOGY MODE: Cable Layer (Garis putus-putus, tanpa glow) ---
  const topologyCableLayer = useMemo<LineLayerSpecification>(
    () => ({
      id: "topology-cables",
      type: "line",
      source: "network-source",
      "source-layer": "edges",
      filter: ["!=", ["get", "cable_type"], "DROP"], // Sembunyikan kabel DROP di topology
      layout: {
        "line-cap": "round",
        "line-join": "round",
        visibility: isTopologyMode && layerVisibility.CABLE ? "visible" : "none",
      },
      paint: {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          1.5,
          15,
          2.5,
          18,
          4,
        ],
        "line-color": [
          "case",
          ["in", ["get", "health_status"], ["literal", ["DOWN", "BROKEN"]]],
          "#ef4444",
          ["==", ["get", "health_status"], "DEGRADED"],
          "#f59e0b",
          ["==", ["get", "status"], "MAINTENANCE"],
          "#eab308",
          ["==", ["get", "status"], "PLAN"],
          "#94a3b8",
          [
            "match",
            ["get", "cable_type"],
            "FEEDER",
            "#22c55e",
            "DISTRIBUTION",
            "#38bdf8",
            "#94a3b8",
          ],
        ],
        "line-opacity": 0.9,
        "line-dasharray": [4, 2], // Garis putus-putus seperti mode lain
      },
    }),
    [isTopologyMode, layerVisibility.CABLE],
  );

  // --- STANDARD MODE: Cable Layer (Base & Satellite) ---
  const standardCableLayer = useMemo<LineLayerSpecification>(
    () => ({
      id: "standard-cables",
      type: "line",
      source: "network-source",
      "source-layer": "edges",
      layout: {
        "line-cap": "round",
        "line-join": "round",
        visibility: !isTopologyMode && layerVisibility.CABLE ? "visible" : "none",
      },
      paint: {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          0.8,
          15,
          1.5,
          18,
          2.5,
        ],
        "line-color": [
          "case",
          ["in", ["get", "health_status"], ["literal", ["DOWN", "BROKEN"]]],
          "#ef4444",
          ["==", ["get", "health_status"], "DEGRADED"],
          "#f59e0b",
          ["==", ["get", "status"], "MAINTENANCE"],
          "#eab308",
          ["==", ["get", "status"], "PLAN"],
          "#94a3b8",
          [
            "match",
            ["get", "cable_type"],
            "FEEDER",
            "#22c55e",
            "DISTRIBUTION",
            "#3b82f6",
            "DROP",
            "#06b6d4",
            "#94a3b8",
          ],
        ],
        "line-opacity": 0.9,
        "line-dasharray": [4, 2],
      },
    }),
    [isTopologyMode, layerVisibility.CABLE],
  );

  // --- OLT LAYERS (POP/Backbone) ---
  const oltNodeLayer = useMemo<CircleLayerSpecification>(
    () => ({
      id: "olt-glow",
      type: "circle",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "OLT"],
      minzoom: 10,
      layout: {
        visibility: layerVisibility.OLT ? "visible" : "none",
      },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 10, 15, 20],
        "circle-color": [
          "case",
          ["in", ["get", "health_status"], ["literal", ["DOWN", "BROKEN"]]],
          "#ef4444",
          ["==", ["get", "health_status"], "DEGRADED"],
          "#f59e0b",
          ["==", ["get", "status"], "MAINTENANCE"],
          "#eab308",
          "#22c55e",
        ],
        "circle-blur": 0.8,
        "circle-opacity": ["interpolate", ["linear"], ["zoom"], 12.5, 0, 13, 0.6],
      },
    }),
    [layerVisibility.OLT],
  );

  const oltIconLayer = useMemo<SymbolLayerSpecification>(
    () => ({
      id: "olt-icons",
      type: "symbol",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "OLT"],
      minzoom: 12.5,
      layout: {
        visibility: layerVisibility.OLT ? "visible" : "none",
        "icon-image": "olt",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 15, 0.8],
        "icon-allow-overlap": true,
      },
      paint: {
        "icon-opacity": ["interpolate", ["linear"], ["zoom"], 12.5, 0, 13, 1],
      },
    }),
    [layerVisibility.OLT],
  );

  const oltLabelLayer = useMemo<SymbolLayerSpecification>(
    () => ({
      id: "olt-labels",
      type: "symbol",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "OLT"],
      minzoom: 12.5,
      layout: {
        visibility: layerVisibility.OLT ? "visible" : "none",
        "text-field": isTopologyMode
          ? ["concat", "BACKBONE / ", ["coalesce", ["get", "code"], "OLT"]]
          : ["coalesce", ["get", "code"], "OLT"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 9, 15, 12],
        "text-offset": [0, 1.5],
        "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#000000",
        "text-halo-width": 2,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 12.5, 0, 13, 1],
      },
    }),
    [isTopologyMode, layerVisibility.OLT],
  );

  // --- ODC LAYERS (Distribution) ---
  const odcNodeLayer = useMemo<CircleLayerSpecification>(
    () => ({
      id: "odc-glow",
      type: "circle",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "ODC"],
      minzoom: 14,
      layout: {
        visibility: layerVisibility.ODC ? "visible" : "none",
      },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 8, 18, 16],
        "circle-color": [
          "case",
          ["in", ["get", "health_status"], ["literal", ["DOWN", "BROKEN"]]],
          "#ef4444",
          ["==", ["get", "health_status"], "DEGRADED"],
          "#f59e0b",
          ["==", ["get", "status"], "MAINTENANCE"],
          "#eab308",
          "#0ea5e9",
        ],
        "circle-blur": 0.8,
        "circle-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15, 0.6],
      },
    }),
    [layerVisibility.ODC],
  );

  const odcIconLayer = useMemo<SymbolLayerSpecification>(
    () => ({
      id: "odc-icons",
      type: "symbol",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "ODC"],
      minzoom: 14,
      layout: {
        visibility: layerVisibility.ODC ? "visible" : "none",
        "icon-image": "odc",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 14, 0.4, 18, 0.7],
        "icon-allow-overlap": true,
      },
      paint: {
        "icon-opacity": ["interpolate", ["linear"], ["zoom"], 14.5, 0, 15, 1],
      },
    }),
    [layerVisibility.ODC],
  );

  const odcLabelLayer = useMemo<SymbolLayerSpecification>(
    () => ({
      id: "odc-labels",
      type: "symbol",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "ODC"],
      minzoom: 15,
      layout: {
        visibility: layerVisibility.ODC ? "visible" : "none",
        "text-field": ["coalesce", ["get", "code"], "ODC"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 15, 9, 18, 12],
        "text-offset": [0, 1.5],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#000000",
        "text-halo-width": 2,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 15.5, 0, 16, 1],
      },
    }),
    [layerVisibility.ODC],
  );

  // --- ODP LAYERS (Access) ---
  const odpNodeLayer = useMemo<CircleLayerSpecification>(
    () => ({
      id: "odp-glow",
      type: "circle",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "ODP"],
      minzoom: 16,
      layout: {
        visibility: layerVisibility.ODP ? "visible" : "none",
      },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 16, 6, 19, 12],
        "circle-color": [
          "case",
          ["in", ["get", "health_status"], ["literal", ["DOWN", "BROKEN"]]],
          "#ef4444",
          ["==", ["get", "health_status"], "DEGRADED"],
          "#f59e0b",
          ["==", ["get", "status"], "MAINTENANCE"],
          "#eab308",
          "#22c55e",
        ],
        "circle-blur": 0.8,
        "circle-opacity": ["interpolate", ["linear"], ["zoom"], 16.5, 0, 17, 0.6],
      },
    }),
    [layerVisibility.ODP],
  );

  const odpIconLayer = useMemo<SymbolLayerSpecification>(
    () => ({
      id: "odp-icons",
      type: "symbol",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "ODP"],
      minzoom: 16,
      layout: {
        visibility: layerVisibility.ODP ? "visible" : "none",
        "icon-image": "odp",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 16, 0.5, 19, 1.0],
        "icon-allow-overlap": true,
      },
      paint: {
        "icon-opacity": ["interpolate", ["linear"], ["zoom"], 16.5, 0, 17, 1],
      },
    }),
    [layerVisibility.ODP],
  );

  const odpLabelLayer = useMemo<SymbolLayerSpecification>(
    () => ({
      id: "odp-labels",
      type: "symbol",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "ODP"],
      minzoom: 17,
      layout: {
        visibility: layerVisibility.ODP ? "visible" : "none",
        "text-field": ["coalesce", ["get", "code"], "ODP"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 17, 9, 20, 12],
        "text-offset": [0, 1.5],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#000000",
        "text-halo-width": 2,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 17.5, 0, 18, 1],
      },
    }),
    [layerVisibility.ODP],
  );

  // --- CUSTOMER LAYER (Standard only) ---
  const customerNodeLayer = useMemo<CircleLayerSpecification>(
    () => ({
      id: "customer-glow",
      type: "circle",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "CUSTOMER"],
      minzoom: 17,
      layout: {
        visibility: !isTopologyMode && layerVisibility.CUSTOMER ? "visible" : "none",
      },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 17, 4, 20, 10],
        "circle-color": [
          "case",
          ["in", ["get", "health_status"], ["literal", ["DOWN", "BROKEN"]]],
          "#ef4444",
          ["==", ["get", "health_status"], "DEGRADED"],
          "#f59e0b",
          ["==", ["get", "status"], "MAINTENANCE"],
          "#eab308",
          "#10b981",
        ],
        "circle-blur": 0.5,
        "circle-opacity": ["interpolate", ["linear"], ["zoom"], 17.5, 0, 18, 0.4],
      },
    }),
    [isTopologyMode, layerVisibility.CUSTOMER],
  );

  const customerIconLayer = useMemo<SymbolLayerSpecification>(
    () => ({
      id: "customer-icons",
      type: "symbol",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["==", ["get", "node_type"], "CUSTOMER"],
      minzoom: 17,
      layout: {
        visibility: !isTopologyMode && layerVisibility.CUSTOMER ? "visible" : "none",
        "icon-image": "customer",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 17, 0.2, 20, 0.5],
        "icon-allow-overlap": true,
      },
      paint: {
        "icon-opacity": ["interpolate", ["linear"], ["zoom"], 17.5, 0, 18, 1],
      },
    }),
    [isTopologyMode, layerVisibility.CUSTOMER],
  );

  // --- HIGHLIGHT LAYERS ---
  const highlightNodeLayer = useMemo<CircleLayerSpecification>(
    () => ({
      id: "highlight-node",
      type: "circle",
      source: "network-source",
      "source-layer": "nodes",
      filter: [
        "==",
        ["get", "id"],
        selectedAsset?.type !== "CABLE"
          ? (selectedAsset?.id || "")
          : -1,
      ],
      paint: {
        "circle-radius": 18,
        "circle-color": "transparent",
        "circle-stroke-width": 3,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": 0.9,
      },
    }),
    [selectedAsset],
  );


  const highlightEdgeLayer = useMemo<LineLayerSpecification>(
    () => ({
      id: "highlight-edge",
      type: "line",
      source: "network-source",
      "source-layer": "edges",
      filter: [
        "==",
        ["get", "id"],
        selectedAsset?.type === "CABLE"
          ? (selectedAsset?.id || "")
          : -1,
      ],
      paint: {
        "line-width": 6,
        "line-color": "#ffffff",
        "line-opacity": 0.8,
      },
    }),
    [selectedAsset],
  );

  // --- OVERLAY LAYERS ---
  const coverageLayer = useMemo<FillLayerSpecification>(
    () => ({
      id: "coverage-layer",
      type: "fill",
      source: "coverage-source",
      paint: {
        "fill-color": "#10b981",
        "fill-opacity": 0.2,
        "fill-outline-color": "#10b981",
      },
    }),
    [],
  );

  const heatmapLayer = useMemo<HeatmapLayerSpecification>(
    () => ({
      id: "signal-heatmap",
      type: "heatmap",
      source: "heatmap-source",
      maxzoom: 22,
      paint: {
        "heatmap-weight": ["get", "weight"],
        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          1,
          18,
          3,
        ],
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(0,0,0,0)",
          0.2,
          "rgba(239, 68, 68, 0.1)",
          0.4,
          "rgba(239, 68, 68, 0.3)",
          0.6,
          "rgba(245, 158, 11, 0.5)",
          0.8,
          "rgba(16, 185, 129, 0.7)",
          1,
          "rgba(16, 185, 129, 0.9)",
        ],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 15, 20, 18, 50],
        "heatmap-opacity": 0.6,
      },
    }),
    [],
  );

  if (!mounted) {
    return (
      <div className="w-full h-full bg-muted/20 animate-pulse flex items-center justify-center">
        <div className="text-muted-foreground text-sm font-medium">
          Initializing Map Engine...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group">
      {/* Grid Overlay - Hanya untuk Topology Mode */}
      {isTopologyMode && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(56,189,248,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56,189,248,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      )}

      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={currentMapStyle}
        style={{ width: "100%", height: "100%" }}
        onLoad={onMapLoad}
        onMove={onMapMove}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={(e) => {
          onMapClick(e);
        }}
        maxZoom={22}
        interactiveLayerIds={[
          "olt-icons",
          "odc-icons",
          "odp-icons",
          "customer-icons",
          "topology-cables",
          "standard-cables",
        ]}
      >
        {allowEditing && isEditMode && (
          <MapDrawControl
            ref={drawRef}
            displayControlsDefault={false}
            onCreate={onDrawCreate}
            onUpdate={onDrawUpdate}
            onDelete={onDrawDelete}
          />
        )}
        <ScaleControl />

        {/* 
          STRATEGI HYBRID SATELLITE: 
          1. Layer Raster Satelit ditaruh paling bawah.
          2. Layer Vektor (Jalan, Building) menyusul di atasnya jika di mode Satellite.
        */}
        {isSatelliteMode && (
          <Source
            id="satellite-tiles"
            type="raster"
            tiles={[
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ]}
            tileSize={256}
            maxzoom={18}
          >
            <Layer id="satellite-imagery" type="raster" />
          </Source>
        )}

        {/* Search Target Highlight (Ripple/Ping Effect via Marker) */}
        {selectedAsset?.lng && selectedAsset?.lat && (
          <Marker longitude={selectedAsset.lng} latitude={selectedAsset.lat}>
            <div className="relative flex items-center justify-center pointer-events-none">
              <div className="absolute w-12 h-12 rounded-full border-2 border-primary animate-ping opacity-75" />
              <div className="absolute w-6 h-6 rounded-full bg-primary/20 animate-pulse" />
              <div
                className="w-3 h-3 rounded-full border-2 border-background z-10"
                style={{
                  backgroundColor: ["DOWN", "FIBERCUT", "BROKEN"].includes(
                    statusOverrides[selectedAsset.code || ""] || selectedAsset.status || "UP"
                  )
                    ? "#ef4444"
                    : ["MAINTENANCE"].includes(
                          statusOverrides[selectedAsset.code || ""] || selectedAsset.status || "UP"
                        )
                      ? "#f59e0b"
                      : "#3b82f6",
                }}
              />
            </div>
          </Marker>
        )}

        {/* Static highlight for selected line edge */}
        <Source
          id="network-source"
          type="vector"
          tiles={[mvtTileUrl]}
          minzoom={0}
          maxzoom={22}
        >
          {/* Infrastructure Layers with Enterprise Zoom Hierarchy */}
          <Layer {...standardCableLayer} />
          <Layer {...topologyCableLayer} />

          <Layer {...oltNodeLayer} />
          <Layer {...oltIconLayer} />
          <Layer {...oltLabelLayer} />

          <Layer {...odcNodeLayer} />
          <Layer {...odcIconLayer} />
          <Layer {...odcLabelLayer} />

          <Layer {...odpNodeLayer} />
          <Layer {...odpIconLayer} />
          <Layer {...odpLabelLayer} />

          <Layer {...customerNodeLayer} />
          <Layer {...customerIconLayer} />

          {/* Highlight Layers (Semua Mode) */}
          <Layer {...highlightEdgeLayer} />
          <Layer {...highlightNodeLayer} />
        </Source>

        {/* COVERAGE OVERLAY */}
        {coverageData && (
          <Source id="coverage-source" type="geojson" data={coverageData}>
            <Layer {...coverageLayer} />
          </Source>
        )}

        {/* TRACED ROUTE OVERLAY */}
        {tracedPath && (
          <Source id="trace-path-source" type="geojson" data={tracedPath}>
            {/* Glow effect (wider, semi-transparent) */}
            <Layer
              id="trace-path-glow"
              type="line"
              paint={{
                "line-width": 10,
                "line-color": "#06b6d4",
                "line-opacity": 0.3,
                "line-blur": 4,
              }}
            />
            {/* Main traced route line */}
            <Layer
              id="trace-path-line"
              type="line"
              layout={{
                "line-cap": "round",
                "line-join": "round",
              }}
              paint={{
                "line-width": 4,
                "line-color": "#06b6d4",
                "line-opacity": 0.9,
                "line-dasharray": [2, 2],
                "line-dashoffset": dashOffset,
              } as LineLayerSpecification["paint"]}
            />
          </Source>
        )}



        {/* HEATMAP OVERLAY */}
        {heatmapData && (
          <Source id="heatmap-source" type="geojson" data={heatmapData}>
            <Layer {...heatmapLayer} />
          </Source>
        )}
      </Map>

      {/* Map Filter Settings UI (Floating Top Right) */}
      <MapFilterControl />

      {/* Floating Map Controls (Zoom & Reset) */}
      <div className="absolute bottom-24 right-6 flex flex-col gap-2 z-30 pointer-events-auto">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-lg shadow-xl bg-background/80 backdrop-blur-md border-border hover:bg-background transition-all"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <Plus className="w-5 h-5 text-foreground" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-lg shadow-xl bg-background/80 backdrop-blur-md border-border hover:bg-background transition-all"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <Minus className="w-5 h-5 text-foreground" />
        </Button>
        <Button
          size="icon"
          className="h-10 w-10 rounded-lg shadow-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all transform active:scale-95"
          onClick={handleResetView}
          title="Reset View"
        >
          <Crosshair className="w-5 h-5" />
        </Button>
      </div>

      {/* Editor Toolbar */}
      {allowEditing && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-100 flex items-center gap-1 bg-background/90 backdrop-blur-md p-2 rounded-full border shadow-xl transition-all duration-300 pointer-events-auto">
          <Button
            variant={!isEditMode ? "default" : "ghost"}
            size="sm"
            className="rounded-full h-8 px-3"
            onClick={() => {
              setIsEditMode(false);
              setDrawingAssetType(null);
              drawRef.current?.changeMode("simple_select");
            }}
          >
            <MousePointer2 className="h-4 w-4 mr-2" /> View
          </Button>
          <Button
            variant={isEditMode && !drawingAssetType ? "default" : "ghost"}
            size="sm"
            className="rounded-full h-8 px-3"
            onClick={() => setIsEditMode(true)}
          >
            <PenTool className="h-4 w-4 mr-2" /> Edit
          </Button>

          {isEditMode && (
            <div className="flex items-center animate-in fade-in zoom-in duration-300">
              <div className="w-px h-5 bg-border mx-1" />
              <Button
                variant={drawingAssetType === "OLT" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => startDrawing("OLT", "draw_point")}
                title="Add OLT"
              >
                <Layers className="h-4 w-4 text-emerald-500" />
              </Button>
              <Button
                variant={drawingAssetType === "ODC" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => startDrawing("ODC", "draw_point")}
                title="Add ODC"
              >
                <Box className="h-4 w-4 text-sky-500" />
              </Button>
              <Button
                variant={drawingAssetType === "ODP" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => startDrawing("ODP", "draw_point")}
                title="Add ODP"
              >
                <GitCommit className="h-4 w-4 text-emerald-400" />
              </Button>
              <Button
                variant={drawingAssetType === "CABLE" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => startDrawing("CABLE", "draw_line_string")}
                title="Draw Cable"
              >
                <Cable className="h-4 w-4 text-slate-400" />
              </Button>
            </div>
          )}
        </div>
      )}

      {allowEditing && <AssetFormSidebar />}

      {/* Hover Tooltip */}
      <MapTooltip feature={hoveredFeature} />

      {/* Trace Mode Banner */}
      {traceMode === "selecting-target" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-100 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 bg-cyan-500/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl shadow-cyan-500/30">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-bold tracking-wide">
              {traceLoading ? "Tracing route..." : `Click a target node to trace from ${traceSourceNode?.code || "source"}`}
            </span>
            <button
              onClick={clearTrace}
              className="ml-2 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Traced Route Clear Button */}
      {tracedPath && traceMode === "idle" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-100 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 bg-cyan-500/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl shadow-cyan-500/30">
            <Cable className="w-4 h-4" />
            <span className="text-sm font-bold">Route traced successfully</span>
            <button
              onClick={clearTrace}
              className="ml-2 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
