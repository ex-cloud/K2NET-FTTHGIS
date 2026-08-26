import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Ai3DMascotType = "voxel" | "cloud" | "jelly" | "astrolabe" | "prism" | "pebble";

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  organizationSuspended: boolean;
  setOrganizationSuspended: (suspended: boolean) => void;
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  aiMascotVariant: Ai3DMascotType;
  setAiMascotVariant: (variant: Ai3DMascotType) => void;
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
    }),
    {
      name: "ftth-ui-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        sidebarOpen: state.sidebarOpen, 
        organizationSuspended: state.organizationSuspended,
        aiMascotVariant: state.aiMascotVariant,
      }),
    }
  )
);
