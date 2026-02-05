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
  setMapCenter: (center: MapCenter) => void;
  setMapStyle: (style: MapStyleMode) => void;
}

export const useMapStore = create<MapState>((set) => ({
  mapCenter: {
    lng: 107.6191,
    lat: -6.9175,
    zoom: 13,
  },
  mapStyle: "base",
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapStyle: (style) => set({ mapStyle: style }),
}));
