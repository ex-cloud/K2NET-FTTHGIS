

import { SystemHeader } from "@/components/system/system-header";
import { AdminSidebar } from "@/components/system/admin-sidebar";
import { SidebarModeProvider, useSidebarMode } from "@/components/sidebar-mode-context";
import { usePathname } from "@/lib/navigation-compat";
import { SystemSecondarySidebar } from "@/components/system/system-secondary-sidebar";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";

import * as React from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { getLogoUrl } from "@/lib/domain";
import { useTaskNotifications } from "@/hooks/useTaskNotifications";
import { FloatingAiAssistant } from "@/components/ai/FloatingAiAssistant";
import { getRouteHeaderTitle } from "@/lib/route-utils";

function SystemLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen, sidebarMode } = useSidebarMode();
  const { settings = [] } = useSystemSettings();

  // Listen to real-time B2B task notifications via SSE
  useTaskNotifications();

  // Due to subdomain rewrite, pathname might be just '/login' on the client side
  const isLoginPage = pathname === "/login" || pathname === "/login";

  // Dynamic branding browser tab title & favicon sync
  React.useEffect(() => {
    if (isLoginPage) return;

    const appName = settings.find((s) => s.key === "app_name")?.value || "FTTH GIS K2NET";
    const logoUrl = settings.find((s) => s.key === "logo_url")?.value;

    const pageTitle = getRouteHeaderTitle(pathname);
    document.title = `${pageTitle} | ${appName}`;

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
          <SystemSecondarySidebar />
          <div className="flex-1 flex flex-col min-w-0 w-0 overflow-hidden relative">
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-background">
              {children}
            </main>
          </div>
        </div>
      </div>
      {/* K2NET AI Assistant — Floating Chat (Ctrl+J) */}
      <FloatingAiAssistant />
    </div>
  );
}

import { LogsFilterProvider } from "@/components/logs/logs-filter-context";

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarModeProvider>
      <CommandPaletteProvider>
        <LogsFilterProvider>
          <SystemLayoutContent>{children}</SystemLayoutContent>
        </LogsFilterProvider>
      </CommandPaletteProvider>
    </SidebarModeProvider>
  );
}
