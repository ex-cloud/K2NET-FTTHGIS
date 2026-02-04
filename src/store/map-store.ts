import { create } from "zustand";

interface MapCenter {
  lng: number;
  lat: number;
  zoom: number;
}

interface MapState {
  mapCenter: MapCenter;
  setMapCenter: (center: MapCenter) => void;
}

export const useMapStore = create<MapState>((set) => ({
  mapCenter: {
    lng: 107.6191,
    lat: -6.9175,
    zoom: 13,
  },
  setMapCenter: (center) => set({ mapCenter: center }),
}));
