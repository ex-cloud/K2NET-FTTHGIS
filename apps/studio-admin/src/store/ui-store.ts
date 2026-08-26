import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Ai3DModelType =
  | "voxel"
  | "cloud"
  | "jelly"
  | "astrolabe"
  | "prism"
  | "pebble"
  | "globe"
  | "waveform"
  | "reactor"
  | "city";

export type Ai3DMascotType = Ai3DModelType;

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  organizationSuspended: boolean;
  setOrganizationSuspended: (suspended: boolean) => void;
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  aiMascotVariant: Ai3DModelType;
  setAiMascotVariant: (variant: Ai3DModelType) => void;
  login3DVariant: Ai3DModelType;
  setLogin3DVariant: (variant: Ai3DModelType) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      organizationSuspended: false,
      setOrganizationSuspended: (suspended) => set({ organizationSuspended: suspended }),
      activeTenantId: null,
      setActiveTenantId: (id) => set({ activeTenantId: id }),
      aiMascotVariant: "voxel",
      setAiMascotVariant: (variant) => set({ aiMascotVariant: variant }),
      login3DVariant: "globe",
      setLogin3DVariant: (variant) => set({ login3DVariant: variant }),
    }),
    {
      name: "ftth-ui-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        sidebarOpen: state.sidebarOpen, 
        organizationSuspended: state.organizationSuspended,
        aiMascotVariant: state.aiMascotVariant,
        login3DVariant: state.login3DVariant,
      }),
    }
  )
);
