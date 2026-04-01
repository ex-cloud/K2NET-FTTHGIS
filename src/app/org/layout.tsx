"use client";

import {
  SidebarModeProvider,
} from "@/components/sidebar-mode-context";
import { GlobalHeader } from "@/components/global-header";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarModeProvider>
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
        <GlobalHeader />
        <div className="flex flex-1 w-full overflow-hidden relative">
          {children}
        </div>
      </div>
    </SidebarModeProvider>
  );
}
