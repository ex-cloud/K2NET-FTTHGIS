import { create } from "zustand";

interface MapCenter {
  lng: number;
  lat: number;
  zoom: number;
}

export type MapStyleMode = "base" | "topology" | "satellite";

interface MapState {
  mapCenter: MapCenter;
  mapStyle: MapStyleMode;
  statusOverrides: Record<string, string>; // code -> status
  setMapCenter: (center: MapCenter) => void;
  setMapStyle: (style: MapStyleMode) => void;
  updateStatusOverride: (code: string, status: string) => void;
}

export const useMapStore = create<MapState>((set) => ({
  mapCenter: {
    lng: 107.6191,
    lat: -6.9175,
    zoom: 13,
  },
  mapStyle: "base",
  statusOverrides: {},
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapStyle: (style) => set({ mapStyle: style }),
  updateStatusOverride: (code, status) =>
    set((state) => ({
      statusOverrides: { ...state.statusOverrides, [code]: status },
    })),
}));
