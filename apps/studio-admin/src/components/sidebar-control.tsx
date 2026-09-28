

import * as React from "react";
import { SidebarModeControl, type SidebarMode, useIsMobile } from "@k2net/ui";
import { useSidebarMode } from "@/components/sidebar-mode-context";

export function SidebarControl({ isExpanded = false }: { isExpanded?: boolean }) {
  const isMobile = useIsMobile();
  const { sidebarMode, setSidebarMode } = useSidebarMode();

  if (isMobile) return null; // Hide on mobile

  return (
    <SidebarModeControl
      mode={sidebarMode}
      onModeChange={setSidebarMode}
      isExpanded={isExpanded}
    />
  );
}

export { type SidebarMode };

