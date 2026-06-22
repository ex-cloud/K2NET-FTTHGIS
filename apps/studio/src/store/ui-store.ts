import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  organizationSuspended: boolean;
  setOrganizationSuspended: (suspended: boolean) => void;
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
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
    }),
    {
      name: "ftth-ui-settings",
      storage: createJSONStorage(() => localStorage),
      // Hanya simpan sidebar dan status suspend, jangan simpan tenant ID agar tidak tertukar antar session
      partialize: (state) => ({ 
        sidebarOpen: state.sidebarOpen, 
        organizationSuspended: state.organizationSuspended 
      }),
    }
  )
);
