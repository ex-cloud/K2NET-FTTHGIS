import { create } from "zustand";

interface SelectedAsset {
  id: string;
  type: string;
  code?: string;
  lng?: number;
  lat?: number;
  signalDb?: number;
  status?: string;
  healthStatus?: string;
}

interface SelectionState {
  selectedAsset: SelectedAsset | null;
  setSelectedAsset: (asset: SelectedAsset | null) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedAsset: null,
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
}));
