import * as React from "react";
import { SidebarModeControl, type SidebarMode } from "@k2net/ui";
import { useSidebarMode } from "./sidebar-mode-context";

export function TenantSidebarControl({
  isExpanded = false,
}: {
  isExpanded?: boolean;
}) {
  const { sidebarMode, setSidebarMode } = useSidebarMode();

  return (
    <SidebarModeControl
      mode={sidebarMode}
      onModeChange={setSidebarMode}
      isExpanded={isExpanded}
    />
  );
}

export { type SidebarMode };

