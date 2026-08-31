import type { LayerSpecification } from "maplibre-gl";

export const MAP_COLORS = {
  backboneCable: "#3b82f6",    // Blue
  distributionCable: "#10b981",// Emerald
  dropCable: "#a855f7",        // Purple
  odcClosure: "#f59e0b",       // Amber
  odpFatBox: "#06b6d4",        // Cyan
  oltPop: "#6366f1",           // Indigo
  signalGood: "#10b981",       // >= -24 dBm (Emerald)
  signalWarning: "#f59e0b",    // -24 to -27 dBm (Amber)
  signalCritical: "#ef4444",   // < -27 dBm (Red)
};

export const FTTH_VECTOR_LAYERS: {
  backbone: LayerSpecification;
  distribution: LayerSpecification;
  odc: LayerSpecification;
  odp: LayerSpecification;
} = {
  backbone: {
    id: "ftth-backbone-cables",
    type: "line",
    source: "martin-mvt",
    "source-layer": "cables_backbone",
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
    "source-layer": "cables_distribution",
    paint: {
      "line-color": MAP_COLORS.distributionCable,
      "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.5, 17, 4],
      "line-opacity": 0.85,
    },
  },
  odc: {
    id: "ftth-odc-closures",
    type: "circle",
    source: "martin-mvt",
    "source-layer": "odc_nodes",
    paint: {
      "circle-color": MAP_COLORS.odcClosure,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 4, 18, 9],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  },
  odp: {
    id: "ftth-odp-boxes",
    type: "circle",
    source: "martin-mvt",
    "source-layer": "odp_nodes",
    paint: {
      "circle-color": MAP_COLORS.odpFatBox,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 3, 18, 7],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#ffffff",
    },
  },
};
