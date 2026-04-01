"use client";

import { MainSidebar } from "@/components/main-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSidebarMode } from "@/components/sidebar-mode-context";

export default function OrganizationContextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open, setOpen } = useSidebarMode();

  return (
    <div className="flex h-full w-full overflow-hidden bg-background relative">
      <MainSidebar />
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 overflow-auto relative p-0">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  );
}
