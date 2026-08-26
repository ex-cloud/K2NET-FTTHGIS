import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type LoginHeroVariant = "geo-core" | "fiber-matrix" | "sentinel";

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  organizationSuspended: boolean;
  setOrganizationSuspended: (suspended: boolean) => void;
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  loginHeroVariant: LoginHeroVariant;
  setLoginHeroVariant: (variant: LoginHeroVariant) => void;
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
      loginHeroVariant: "geo-core",
      setLoginHeroVariant: (variant) => set({ loginHeroVariant: variant }),
    }),
    {
      name: "ftth-ui-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        sidebarOpen: state.sidebarOpen, 
        organizationSuspended: state.organizationSuspended,
        loginHeroVariant: state.loginHeroVariant,
      }),
    }
  )
);
