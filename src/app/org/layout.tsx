"use client";

import {
  SidebarModeProvider,
} from "@/components/sidebar-mode-context";
import { SuspensionOverlay } from "@/components/tenant/suspension-overlay";
import { GlobalHeader } from "@/components/global-header";
import { useUIStore } from "@/store/ui-store";
import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { setOrganizationSuspended } = useUIStore();
  const params = useParams();

  // Reset suspension state when returning to the organization list
  useEffect(() => {
    if (!params?.orgId) {
      setOrganizationSuspended(false);
    }
  }, [params?.orgId, setOrganizationSuspended]);

  return (
    <SidebarModeProvider>
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
        <SuspensionOverlay />
        <GlobalHeader />
        <div className="flex flex-1 w-full overflow-hidden relative">
          {children}
        </div>
      </div>
    </SidebarModeProvider>
  );
}
