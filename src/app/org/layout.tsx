"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import {
  SidebarModeProvider,
  useSidebarMode,
} from "@/components/sidebar-mode-context";
import { GlobalHeader } from "@/components/global-header";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarModeProvider>
      <OrgLayoutContent>{children}</OrgLayoutContent>
    </SidebarModeProvider>
  );
}

function OrgLayoutContent({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSidebarMode();

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <GlobalHeader />
      <div className="flex flex-1 w-full overflow-hidden">
        <SidebarProvider open={open} onOpenChange={setOpen}>
          <div className="flex flex-1 overflow-hidden relative">{children}</div>
        </SidebarProvider>
      </div>
    </div>
  );
}
