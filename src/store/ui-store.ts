import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  organizationSuspended: boolean;
  setOrganizationSuspended: (suspended: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      organizationSuspended: false,
      setOrganizationSuspended: (suspended) => set({ organizationSuspended: suspended }),
    }),
    {
      name: "ftth-ui-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
