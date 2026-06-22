import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Feature, FeatureCollection, LineString } from "geojson";

interface MapCenter {
  lng: number;
  lat: number;
  zoom: number;
}

export type MapStyleMode = "base" | "topology" | "satellite";
export type DrawAssetType = "ODP" | "ODC" | "OLT" | "CABLE" | null;

// Trace Path mode state
export type TraceMode = "idle" | "selecting-target";

interface MapState {
  mapCenter: MapCenter;
  mapStyle: MapStyleMode;
  statusOverrides: Record<string, string>; // code -> status
  isEditMode: boolean;
  drawingAssetType: DrawAssetType;
  drawnFeature: Feature | null;
  isFormOpen: boolean;
  tileRefreshKey: number;
  editingAsset: {
    id: string;
    type: DrawAssetType;
    code: string;
    status?: string;
    name?: string;
    lat?: number;
    lng?: number;
    properties: Record<string, unknown>;
  } | null;

  // Trace Path state
  traceMode: TraceMode;
  traceSourceNode: { id: string; code: string } | null;
  tracedPath: FeatureCollection<LineString> | null;

  // Layer Visibility
  layerVisibility: {
    OLT: boolean;
    ODC: boolean;
    ODP: boolean;
    CUSTOMER: boolean;
    CABLE: boolean;
  };

  setMapCenter: (center: MapCenter) => void;
  setMapStyle: (style: MapStyleMode) => void;
  updateStatusOverride: (code: string, status: string) => void;
  setIsEditMode: (isEdit: boolean) => void;
  setDrawingAssetType: (type: DrawAssetType) => void;
  setDrawnFeature: (feature: Feature | null) => void;
  setIsFormOpen: (isOpen: boolean) => void;
  setEditingAsset: (asset: { id: string; type: DrawAssetType; code: string; status?: string; name?: string; lat?: number; lng?: number; properties: Record<string, unknown> } | null) => void;
  triggerTileRefresh: () => void;

  // Trace Path actions
  startTraceMode: (sourceNode: { id: string; code: string }) => void;
  setTracedPath: (path: FeatureCollection<LineString> | null) => void;
  clearTrace: () => void;

  setLayerVisibility: (layer: keyof MapState['layerVisibility'], visible: boolean) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      mapCenter: {
        lng: 107.6191,
        lat: -6.9175,
        zoom: 13,
      },
      mapStyle: "base",
      statusOverrides: {},
      isEditMode: false,
      drawingAssetType: null,
      drawnFeature: null,
      isFormOpen: false,
      tileRefreshKey: 0,
      editingAsset: null,

      // Trace Path defaults
      traceMode: "idle",
      traceSourceNode: null,
      tracedPath: null,

      // Layer Visibility defaults
      layerVisibility: {
        OLT: true,
        ODC: true,
        ODP: true,
        CUSTOMER: true,
        CABLE: true,
      },

      setMapCenter: (center) => set({ mapCenter: center }),
      setMapStyle: (style) => set({ mapStyle: style }),
      updateStatusOverride: (code, status) =>
        set((state) => ({
          statusOverrides: { ...state.statusOverrides, [code]: status },
        })),
      setIsEditMode: (isEdit) => set({ isEditMode: isEdit }),
      setDrawingAssetType: (type) => set({ drawingAssetType: type }),
      setDrawnFeature: (feature) => set({ drawnFeature: feature }),
      setIsFormOpen: (isOpen) => set({ isFormOpen: isOpen }),
      setEditingAsset: (asset) => set({ editingAsset: asset }),
      triggerTileRefresh: () => set((state) => ({ tileRefreshKey: state.tileRefreshKey + 1 })),

      // Trace Path actions
      startTraceMode: (sourceNode) =>
        set({ traceMode: "selecting-target", traceSourceNode: sourceNode, tracedPath: null }),
      setTracedPath: (path) =>
        set({ tracedPath: path, traceMode: "idle" }),
      clearTrace: () =>
        set({ tracedPath: null, traceMode: "idle", traceSourceNode: null }),

      setLayerVisibility: (layer, visible) =>
        set((state) => ({
          layerVisibility: { ...state.layerVisibility, [layer]: visible },
        })),
    }),
    {
      name: "ftth-map-settings",
      storage: createJSONStorage(() => localStorage),
      // Only persist specific keys to avoid weird UI states on reload
      partialize: (state) => ({
        mapCenter: state.mapCenter,
        mapStyle: state.mapStyle,
        layerVisibility: state.layerVisibility,
      }),
    }
  )
);
