"use client";

import { useEffect, useRef } from "react";
import { OrgTeamSidebar } from "@/components/org-team-sidebar";
import { useSidebarMode, type SidebarMode } from "@/components/sidebar-mode-context";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarMode, setSidebarMode } = useSidebarMode();
  const previousModeRef = useRef<SidebarMode | null>(null);

  // Auto-collapse main sidebar when secondary sidebar is present
  useEffect(() => {
    if (sidebarMode === "expanded") {
      previousModeRef.current = sidebarMode;
      setSidebarMode("collapsed");
    }
    return () => {
      // Restore previous mode when leaving this layout
      if (previousModeRef.current === "expanded") {
        setSidebarMode("expanded");
        previousModeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 h-full overflow-hidden w-full min-w-0">
      {/* Secondary Contextual Sidebar for Team */}
      <OrgTeamSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-0 overflow-hidden relative">
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-[#080808]">
          {children}
        </main>
      </div>
    </div>
  );
}
