import { useMemo } from "react";
import type {
  CircleLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
  HeatmapLayerSpecification,
  FillLayerSpecification,
} from "maplibre-gl";

export interface SelectedAsset {
  id: string;
  type: string;
  code?: string;
  status?: string;
  signalDb?: number;
  healthStatus?: string;
  lng?: number;
  lat?: number;
}

interface UseMapLayersProps {
  isTopologyMode: boolean;
  layerVisibility: Record<string, boolean>;
  selectedAsset: SelectedAsset | null;
}

export function useMapLayers({
  isTopologyMode,
  layerVisibility,
  selectedAsset,
}: UseMapLayersProps) {
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

  return {
    topologyCableLayer,
    standardCableLayer,
    oltNodeLayer,
    oltIconLayer,
    oltLabelLayer,
    odcNodeLayer,
    odcIconLayer,
    odcLabelLayer,
    odpNodeLayer,
    odpIconLayer,
    odpLabelLayer,
    customerNodeLayer,
    customerIconLayer,
    highlightNodeLayer,
    highlightEdgeLayer,
    coverageLayer,
    heatmapLayer,
  };
}
