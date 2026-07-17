"use client";

import { SystemHeader } from "@/components/system/system-header";
import { AdminSidebar } from "@/components/system/admin-sidebar";
import { SidebarModeProvider, useSidebarMode } from "@/components/sidebar-mode-context";
import { SidebarProvider } from "@k2net/ui";
import { usePathname } from "next/navigation";
import { SystemSecondarySidebar } from "@/components/system/system-secondary-sidebar";

import * as React from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { getLogoUrl } from "@/lib/domain";

function SystemLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebarMode();
  const { settings = [] } = useSystemSettings();

  // Due to subdomain rewrite, pathname might be just '/login' on the client side
  const isLoginPage = pathname === "/login" || pathname === "/login";

  // Dynamic branding browser tab title & favicon sync
  React.useEffect(() => {
    if (isLoginPage) return;

    const appName = settings.find((s) => s.key === "app_name")?.value;
    const logoUrl = settings.find((s) => s.key === "logo_url")?.value;

    if (appName) {
      const segments = pathname.split("/").filter(Boolean);
      const lastSegment = segments[segments.length - 1] || "Overview";
      const pageTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      document.title = lastSegment.toLowerCase() === "system" ? appName : `${pageTitle} | ${appName}`;
    }

    if (logoUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = getLogoUrl(logoUrl);
    }
  }, [settings, pathname, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
      <SystemHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <AdminSidebar />
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <SidebarProvider open={open} onOpenChange={setOpen} className="min-h-0 h-full flex-1 w-full">
            <div className="flex flex-1 h-full overflow-hidden w-full min-h-0">
              <SystemSecondarySidebar />
              <div className="flex-1 flex flex-col min-w-0 w-0 overflow-hidden relative">
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-[#080808]">
                  {children}
                </main>
              </div>
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
