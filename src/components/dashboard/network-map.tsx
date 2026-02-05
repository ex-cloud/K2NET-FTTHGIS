"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import Map, {
  Source,
  Layer,
  NavigationControl,
  ScaleControl,
  MapRef,
} from "react-map-gl/maplibre";
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
import { getBackendBaseUrl } from "@/lib/api-config";
import { MapLayerMouseEvent } from "maplibre-gl";

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

export function NetworkMap() {
  const mapRef = useRef<MapRef>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { selectedAsset, setSelectedAsset } = useSelectionStore();
  const { mapCenter, setMapCenter, mapStyle } = useMapStore();

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

  // Compute base map style based on mode
  const currentMapStyle = useMemo(() => {
    if (isTopologyMode) {
      return TOPOLOGY_STYLE;
    }
    // For Base and Satellite modes, use the standard map styles
    return theme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
  }, [theme, isTopologyMode]);

  // Fix for hydration mismatch (Client-side only mount)
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  const mvtTileUrl = useMemo(() => {
    const baseUrl = getBackendBaseUrl();
    return `${baseUrl}/network/mvt/{z}/{x}/{y}`;
  }, []);

  const onMapClick = (evt: MapLayerMouseEvent) => {
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

      setSelectedAsset({
        id: id.toString(),
        type,
        code,
        lng,
        lat,
        signalDb: feature.properties.signal_db,
      });
    } else {
      setSelectedAsset(null);
    }
  };

  const onMapMove = (evt: {
    viewState: { longitude: number; latitude: number; zoom: number };
  }) => {
    const { longitude, latitude, zoom } = evt.viewState;
    setMapCenter({ lng: longitude, lat: latitude, zoom });
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
        visibility: isTopologyMode ? "visible" : "none",
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
          [
            "in",
            ["get", "status"],
            ["literal", ["DOWN", "FIBERCUT", "BROKEN"]],
          ],
          "#ef4444",
          ["==", ["get", "status"], "MAINTENANCE"],
          "#f59e0b",
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
    [isTopologyMode],
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
        visibility: isTopologyMode ? "none" : "visible",
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
          [
            "in",
            ["get", "status"],
            ["literal", ["DOWN", "FIBERCUT", "BROKEN"]],
          ],
          "#ef4444",
          ["==", ["get", "status"], "MAINTENANCE"],
          "#f59e0b",
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
    [isTopologyMode],
  );

  // --- TOPOLOGY MODE: Nodes (OLT, ODC, ODP saja - tanpa CUSTOMER) ---
  const topologyNodeLayer = useMemo<CircleLayerSpecification>(
    () => ({
      id: "topology-nodes",
      type: "circle",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["!=", ["get", "node_type"], "CUSTOMER"],
      layout: {
        visibility: isTopologyMode ? "visible" : "none",
      },
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          ["match", ["get", "node_type"], "OLT", 6, "ODC", 5, "ODP", 4, 3],
          15,
          ["match", ["get", "node_type"], "OLT", 12, "ODC", 10, "ODP", 8, 6],
        ],
        "circle-color": "#0a0a0f",
        "circle-stroke-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          2,
          15,
          3,
        ],
        "circle-stroke-color": [
          "case",
          [
            "in",
            ["get", "status"],
            ["literal", ["DOWN", "FIBERCUT", "BROKEN"]],
          ],
          "#ef4444",
          "#38bdf8",
        ],
      },
    }),
    [isTopologyMode],
  );

  // --- STANDARD MODE: Nodes (Base & Satellite - semua nodes) ---
  const standardNodeLayer = useMemo<CircleLayerSpecification>(
    () => ({
      id: "standard-nodes",
      type: "circle",
      source: "network-source",
      "source-layer": "nodes",
      layout: {
        visibility: isTopologyMode ? "none" : "visible",
      },
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          [
            "match",
            ["get", "node_type"],
            "OLT",
            6,
            "ODC",
            5,
            "ODP",
            4,
            "CUSTOMER",
            2,
            3,
          ],
          15,
          [
            "match",
            ["get", "node_type"],
            "OLT",
            14,
            "ODC",
            12,
            "ODP",
            10,
            "CUSTOMER",
            5,
            6,
          ],
        ],
        "circle-color": [
          "case",
          [
            "in",
            ["get", "status"],
            ["literal", ["DOWN", "FIBERCUT", "BROKEN"]],
          ],
          "#ef4444",
          ["==", ["get", "status"], "MAINTENANCE"],
          "#f59e0b",
          [
            "match",
            ["get", "node_type"],
            "OLT",
            "#f59e0b",
            "ODC",
            "#0ea5e9",
            "ODP",
            "#22c55e",
            "CUSTOMER",
            "#10b981",
            "#94a3b8",
          ],
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    }),
    [isTopologyMode],
  );

  // --- TOPOLOGY MODE: Labels (OLT, ODC, ODP dengan kode teknis) ---
  const topologyLabelLayer = useMemo<SymbolLayerSpecification>(
    () => ({
      id: "topology-labels",
      type: "symbol",
      source: "network-source",
      "source-layer": "nodes",
      filter: ["!=", ["get", "node_type"], "CUSTOMER"],
      minzoom: 12,
      layout: {
        visibility: isTopologyMode ? "visible" : "none",
        "text-field": [
          "case",
          ["==", ["get", "node_type"], "OLT"],
          ["concat", "BACKBONE / ", ["coalesce", ["get", "code"], "OLT"]],
          ["coalesce", ["get", "code"], ["get", "node_type"]],
        ],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 9, 15, 11],
        "text-offset": [0, 1.6],
        "text-anchor": "top",
        "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.05,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#000000",
        "text-halo-width": 2,
      },
    }),
    [isTopologyMode],
  );

  // --- STANDARD MODE: Labels (Base & Satellite - semua aset dengan kode) ---
  const standardLabelLayer = useMemo<SymbolLayerSpecification>(
    () => ({
      id: "standard-labels",
      type: "symbol",
      source: "network-source",
      "source-layer": "nodes",
      minzoom: 13,
      layout: {
        visibility: isTopologyMode ? "none" : "visible",
        "text-field": ["coalesce", ["get", "code"], ["get", "node_type"]],
        "text-size": ["interpolate", ["linear"], ["zoom"], 13, 9, 16, 12],
        "text-offset": [0, 1.5],
        "text-anchor": "top",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color":
          theme === "dark" || isSatelliteMode ? "#ffffff" : "#1e293b",
        "text-halo-color":
          theme === "dark" || isSatelliteMode ? "#0f172a" : "#ffffff",
        "text-halo-width": 2,
      },
    }),
    [isTopologyMode, isSatelliteMode, theme],
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
          ? parseInt(selectedAsset?.id || "0")
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
          ? parseInt(selectedAsset?.id || "0")
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
        onClick={onMapClick}
        onMove={onMapMove}
        maxZoom={22}
        interactiveLayerIds={[
          "topology-nodes",
          "topology-cables",
          "standard-nodes",
          "standard-cables",
        ]}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <ScaleControl />

        {/* SATELLITE MODE: Raster Tile Layer */}
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

        {/* INFRASTRUCTURE DATA */}
        <Source
          id="network-source"
          type="vector"
          tiles={[mvtTileUrl]}
          minzoom={0}
          maxzoom={22}
        >
          {/* Topology Layers (Garis putus-putus, tanpa glow) */}
          <Layer {...topologyCableLayer} />
          <Layer {...topologyNodeLayer} />
          <Layer {...topologyLabelLayer} />

          {/* Standard Layers (Base & Satellite) */}
          <Layer {...standardCableLayer} />
          <Layer {...standardNodeLayer} />
          <Layer {...standardLabelLayer} />

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

        {/* HEATMAP OVERLAY */}
        {heatmapData && (
          <Source id="heatmap-source" type="geojson" data={heatmapData}>
            <Layer {...heatmapLayer} />
          </Source>
        )}
      </Map>
    </div>
  );
}
