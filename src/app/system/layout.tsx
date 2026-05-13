"use client";

import { SystemHeader } from "@/components/system/system-header";
import { AdminSidebar } from "@/components/system/admin-sidebar";
import { SidebarModeProvider, useSidebarMode } from "@/components/sidebar-mode-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

function SystemLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebarMode();
  // Due to subdomain rewrite, pathname might be just '/login' on the client side
  const isLoginPage = pathname === "/system/login" || pathname === "/login";

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
      <SystemHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <AdminSidebar />
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <SidebarProvider open={open} onOpenChange={setOpen}>
            <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
              {children}
            </div>
          </SidebarProvider>
        </div>
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
