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

export function NetworkMap() {
  const mapRef = useRef<MapRef>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { selectedAsset, setSelectedAsset } = useSelectionStore();
  const { mapCenter, setMapCenter } = useMapStore();

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

    // Only fly if coordinates are significantly different (to avoid loop during manual drag)
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
      const sourceLayer = feature.sourceLayer; // 'nodes' or 'edges'

      const type =
        sourceLayer === "nodes" ? feature.properties.node_type : "CABLE";
      const id = feature.properties.id;
      const code = feature.properties.code || `${type}-${id}`;

      // Extract geometry for visual effects
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

  // Layer Styles - Cables with dashed lines and type-based coloring
  const cableLayer = useMemo<LineLayerSpecification>(
    () => ({
      id: "network-edges-layer",
      type: "line",
      source: "network-source",
      "source-layer": "edges",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          0.5,
          15,
          1.5,
          18,
          2.5,
        ],
        // Priority: Status (DOWN=red) > Cable Type (color coding)
        "line-color": [
          "case",
          // If status is DOWN/FIBERCUT/BROKEN -> Red
          [
            "in",
            ["get", "status"],
            ["literal", ["DOWN", "FIBERCUT", "BROKEN"]],
          ],
          "#ef4444", // Red 500
          // If MAINTENANCE -> Amber
          ["==", ["get", "status"], "MAINTENANCE"],
          "#f59e0b", // Amber 500
          // Otherwise color by cable_type
          [
            "match",
            ["get", "cable_type"],
            "FEEDER",
            "#22c55e", // Green 500 - Backbone (OLT to ODC)
            "DISTRIBUTION",
            "#3b82f6", // Blue 500 - Distribution (ODC to ODP)
            "DROP",
            "#06b6d4", // Cyan 500 - Drop cable (ODP to Customer)
            "#94a3b8", // Slate 400 (default)
          ],
        ],
        "line-opacity": 0.7,
        // Dashed line pattern: dash length, gap length
        "line-dasharray": [4, 2],
      },
    }),
    [],
  );

  const nodeLayer = useMemo<CircleLayerSpecification>(
    () => ({
      id: "network-nodes-layer",
      type: "circle",
      source: "network-source",
      "source-layer": "nodes",
      paint: {
        // Size based on node hierarchy: OLT > ODC > ODP > Customer
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
            3,
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
            7,
            6,
          ],
        ],
        // Prioritize status-based coloring: DOWN/FIBERCUT = Red
        "circle-color": [
          "case",
          // If status is DOWN, FIBERCUT, or BROKEN -> Red
          [
            "in",
            ["get", "status"],
            ["literal", ["DOWN", "FIBERCUT", "BROKEN"]],
          ],
          "#ef4444", // Red 500
          // If status is MAINTENANCE -> Amber
          ["==", ["get", "status"], "MAINTENANCE"],
          "#f59e0b", // Amber 500
          // Otherwise, color by node_type
          [
            "match",
            ["get", "node_type"],
            "OLT",
            "#f59e0b", // Amber 500
            "ODC",
            "#0ea5e9", // Sky 500
            "ODP",
            "#22c55e", // Green 500
            "CUSTOMER",
            "#10b981", // Emerald 500
            "#94a3b8", // Slate 400 (default)
          ],
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": [
          "case",
          [
            "in",
            ["get", "status"],
            ["literal", ["DOWN", "FIBERCUT", "BROKEN"]],
          ],
          "#dc2626", // Red 600 (darker stroke for DOWN)
          "#ffffff",
        ],
      },
    }),
    [],
  );

  const nodeLabelLayer = useMemo<SymbolLayerSpecification>(
    () => ({
      id: "network-nodes-label",
      type: "symbol",
      source: "network-source",
      "source-layer": "nodes",
      minzoom: 13,
      layout: {
        // Show icon emoji + abbreviated type based on node_type
        "text-field": [
          "match",
          ["get", "node_type"],
          "OLT",
          "📡",
          "ODC",
          "📦",
          "ODP",
          "📍",
          "CUSTOMER",
          "👤",
          "●",
        ],
        "text-size": [
          "match",
          ["get", "node_type"],
          "OLT",
          18,
          "ODC",
          16,
          "ODP",
          14,
          "CUSTOMER",
          12,
          12,
        ],
        "text-offset": [0, 0],
        "text-anchor": "center",
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": [
          "case",
          [
            "in",
            ["get", "status"],
            ["literal", ["DOWN", "FIBERCUT", "BROKEN"]],
          ],
          "#ef4444", // Red for DOWN
          theme === "dark" ? "#ffffff" : "#1e293b",
        ],
        "text-halo-color": theme === "dark" ? "#0f172a" : "#ffffff",
        "text-halo-width": 2,
      },
    }),
    [theme],
  );

  const highlightNodeLayer = useMemo<CircleLayerSpecification>(
    () => ({
      id: "selected-node-highlight",
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
        "circle-radius": 12,
        "circle-color": "transparent",
        "circle-stroke-width": 4,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-opacity": 0.8,
      },
    }),
    [selectedAsset],
  );

  const highlightEdgeLayer = useMemo<LineLayerSpecification>(
    () => ({
      id: "selected-edge-highlight",
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
        "line-opacity": 0.5,
      },
    }),
    [selectedAsset],
  );

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
      id: "signal-heatmap-layer",
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
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={theme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light}
        style={{ width: "100%", height: "100%" }}
        onClick={onMapClick}
        onMove={onMapMove}
        interactiveLayerIds={["network-nodes-layer", "network-edges-layer"]}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <ScaleControl />

        <Source
          id="network-source"
          type="vector"
          tiles={[mvtTileUrl]}
          minzoom={0}
          maxzoom={22}
        >
          <Layer {...cableLayer} />
          <Layer {...nodeLayer} />
          <Layer {...nodeLabelLayer} />
          <Layer {...highlightEdgeLayer} />
          <Layer {...highlightNodeLayer} />
        </Source>

        {coverageData && (
          <Source id="coverage-source" type="geojson" data={coverageData}>
            <Layer {...coverageLayer} />
          </Source>
        )}

        {heatmapData && (
          <Source id="heatmap-source" type="geojson" data={heatmapData}>
            <Layer {...heatmapLayer} />
          </Source>
        )}
      </Map>
    </div>
  );
}
