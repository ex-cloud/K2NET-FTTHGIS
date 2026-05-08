"use client";

import { SystemHeader } from "@/components/system/system-header";
import { AdminSidebar } from "@/components/system/admin-sidebar";
import { SidebarModeProvider, useSidebarMode } from "@/components/sidebar-mode-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

function SystemLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebarMode();
  const isLoginPage = pathname === "/system/login";

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
      <SystemHeader />
      <div className="flex flex-1 w-full overflow-hidden relative">
        <AdminSidebar />
        <SidebarProvider open={open} onOpenChange={setOpen}>
          <div className="flex-1 flex flex-col pt-16 px-8 bg-background h-full overflow-y-auto">
            <div className="w-full max-w-5xl mx-auto space-y-12">
              {children}
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarModeProvider>
      <SystemLayoutContent>{children}</SystemLayoutContent>
    </SidebarModeProvider>
  );
}
