import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type LoginHeroFigureId = "fig-01" | "fig-02" | "fig-03" | "fig-04" | "fig-05" | "fig-06";

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  organizationSuspended: boolean;
  setOrganizationSuspended: (suspended: boolean) => void;
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  activeLoginHeroId: LoginHeroFigureId;
  setActiveLoginHeroId: (id: LoginHeroFigureId) => void;
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
      activeLoginHeroId: "fig-01",
      setActiveLoginHeroId: (id) => set({ activeLoginHeroId: id }),
    }),
    {
      name: "ftth-ui-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        sidebarOpen: state.sidebarOpen, 
        organizationSuspended: state.organizationSuspended,
        activeLoginHeroId: state.activeLoginHeroId,
      }),
    }
  )
);
