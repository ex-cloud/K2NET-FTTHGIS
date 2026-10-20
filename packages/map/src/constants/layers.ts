import type { LayerSpecification } from "maplibre-gl";

export const MAP_COLORS = {
  backboneCable: "#3b82f6",    // Blue
  distributionCable: "#10b981",// Emerald
  dropCable: "#a855f7",        // Purple
  odcClosure: "#f59e0b",       // Amber
  odpFatBox: "#06b6d4",        // Cyan
  oltPop: "#6366f1",           // Indigo
  customerOnt: "#ec4899",      // Pink
  pole: "#71717a",             // Zinc
  signalGood: "#10b981",       // >= -24 dBm (Emerald)
  signalWarning: "#f59e0b",    // -24 to -27 dBm (Amber)
  signalCritical: "#ef4444",   // < -27 dBm (Red)
};

export const FTTH_VECTOR_LAYERS: {
  cables: LayerSpecification;
  olt: LayerSpecification;
  odc: LayerSpecification;
  odp: LayerSpecification;
  customer: LayerSpecification;
  backbone: LayerSpecification;
  distribution: LayerSpecification;
} = {
  // All network cables from 'edges' MVT layer
  cables: {
    id: "ftth-edges-cables",
    type: "line",
    source: "martin-mvt",
    "source-layer": "edges",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": [
        "match",
        ["coalesce", ["get", "cable_type"], "DISTRIBUTION"],
        "FEEDER", MAP_COLORS.backboneCable,
        "BACKBONE", MAP_COLORS.backboneCable,
        "DROP", MAP_COLORS.dropCable,
        MAP_COLORS.distributionCable, // fallback default
      ],
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10, 1.5,
        14, 3,
        18, 6
      ],
      "line-opacity": 0.9,
    },
  },

  // OLT Pop nodes
  olt: {
    id: "ftth-nodes-olt",
    type: "circle",
    source: "martin-mvt",
    "source-layer": "nodes",
    filter: ["==", ["get", "node_type"], "OLT"],
    paint: {
      "circle-color": MAP_COLORS.oltPop,
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10, 5,
        14, 8,
        18, 14
      ],
      "circle-stroke-width": 2.5,
      "circle-stroke-color": "#ffffff",
    },
  },

  // ODC Optical Distribution Closures
  odc: {
    id: "ftth-nodes-odc",
    type: "circle",
    source: "martin-mvt",
    "source-layer": "nodes",
    filter: ["==", ["get", "node_type"], "ODC"],
    paint: {
      "circle-color": MAP_COLORS.odcClosure,
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        11, 4,
        14, 6.5,
        18, 11
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  },

  // ODP Optical Distribution Points
  odp: {
    id: "ftth-nodes-odp",
    type: "circle",
    source: "martin-mvt",
    "source-layer": "nodes",
    filter: ["==", ["get", "node_type"], "ODP"],
    paint: {
      "circle-color": MAP_COLORS.odpFatBox,
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        12, 3,
        15, 5.5,
        18, 9
      ],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#ffffff",
    },
  },

  // Customer Premises / ONT
  customer: {
    id: "ftth-nodes-customer",
    type: "circle",
    source: "martin-mvt",
    "source-layer": "nodes",
    filter: ["==", ["get", "node_type"], "CUSTOMER"],
    paint: {
      "circle-color": MAP_COLORS.customerOnt,
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        13, 2.5,
        16, 4.5,
        18, 8
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": "#ffffff",
    },
  },

  // Backward compatibility aliases
  backbone: {
    id: "ftth-backbone-cables",
    type: "line",
    source: "martin-mvt",
    "source-layer": "edges",
    paint: {
      "line-color": MAP_COLORS.backboneCable,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 16, 6],
      "line-opacity": 0.9,
    },
  },
  distribution: {
    id: "ftth-distribution-cables",
    type: "line",
    source: "martin-mvt",
    "source-layer": "edges",
    paint: {
      "line-color": MAP_COLORS.distributionCable,
      "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.5, 17, 4],
      "line-opacity": 0.85,
    },
  },
};

export const FTTH_HEATMAP_LAYERS: {
  heatmap: LayerSpecification;
  points: LayerSpecification;
} = {
  // Optical attenuation heatmap density layer
  heatmap: {
    id: "ftth-optical-heatmap",
    type: "heatmap",
    source: "martin-mvt",
    "source-layer": "nodes",
    maxzoom: 17,
    filter: ["==", ["get", "node_type"], "CUSTOMER"],
    paint: {
      // Weight increases for weaker signals (higher loss) to highlight problem zones
      "heatmap-weight": [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "signal_db"], -22],
        -30, 1.0,
        -25, 0.7,
        -20, 0.4,
        -15, 0.1,
      ],
      "heatmap-intensity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0, 1,
        15, 3,
      ],
      // Density color gradient: Transparent -> Cyan -> Emerald -> Amber -> Red
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0, "rgba(0, 0, 0, 0)",
        0.2, "#06b6d4",
        0.4, "#10b981",
        0.6, "#f59e0b",
        0.8, "#f97316",
        1.0, "#ef4444",
      ],
      "heatmap-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0, 2,
        9, 14,
        15, 28,
      ],
      "heatmap-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        12, 0.85,
        16, 0.25,
      ],
    },
  },

  // Individual customer point inspectability at higher zoom levels
  points: {
    id: "ftth-heatmap-points",
    type: "circle",
    source: "martin-mvt",
    "source-layer": "nodes",
    minzoom: 13,
    filter: ["==", ["get", "node_type"], "CUSTOMER"],
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        13, 3,
        16, 6.5,
      ],
      "circle-color": [
        "case",
        [">=", ["coalesce", ["get", "signal_db"], -19], -20],
        MAP_COLORS.signalGood,
        [">=", ["coalesce", ["get", "signal_db"], -19], -25],
        MAP_COLORS.signalWarning,
        MAP_COLORS.signalCritical,
      ],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        13, 0.5,
        15, 1,
      ],
    },
  },
};

