import * as React from "react";
import {
  SidebarModeProvider as SharedSidebarModeProvider,
  useSidebarMode,
  type SidebarMode,
  type SidebarModeContextProps,
  type SidebarModeProviderProps,
} from "@k2net/ui";

export function SidebarModeProvider({
  children,
  storageKey = "tenant-sidebar-mode",
  defaultMode = "expanded",
}: SidebarModeProviderProps) {
  return (
    <SharedSidebarModeProvider
      storageKey={storageKey}
      defaultMode={defaultMode}
    >
      {children}
    </SharedSidebarModeProvider>
  );
}

export { useSidebarMode, type SidebarMode, type SidebarModeContextProps };

