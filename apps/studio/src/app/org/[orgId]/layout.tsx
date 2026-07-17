"use client";

import { MainSidebar } from "@/components/tenant/main-sidebar";
import { TenantSecondarySidebar } from "@/components/tenant/tenant-secondary-sidebar";
import { RealTimeNotificationClient } from "@/components/real-time-notification-client";
import { DetailSlidePanel } from "@/components/dashboard/detail-slide-panel";
import { SidebarProvider } from "@k2net/ui";
import { useSidebarMode } from "@/components/sidebar-mode-context";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useUIStore } from "@/store/ui-store";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function OrganizationContextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open, setOpen } = useSidebarMode();
  const params = useParams();
  const { organizations } = useOrganizations();
  const { setOrganizationSuspended, setActiveTenantId } = useUIStore();

  useEffect(() => {
    if (params?.orgId && organizations.length > 0) {
      const currentOrg = organizations.find((org) => org.slug === params.orgId);
      if (currentOrg) {
        // Set tenant ID for API requests
        setActiveTenantId(currentOrg.id || null);
        
        // Handle suspension status
        const isSuspended = currentOrg.status === 'SUSPENDED' || currentOrg.status === 'TRIAL_EXPIRED';
        setOrganizationSuspended(isSuspended);
      }
    }
  }, [params?.orgId, organizations, setOrganizationSuspended, setActiveTenantId]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background relative">
      <MainSidebar />
      <div className="flex-1 flex min-w-0 overflow-hidden">
        <SidebarProvider open={open} onOpenChange={setOpen} className="min-h-0 h-full flex-1 w-full">
          <RealTimeNotificationClient />
          <DetailSlidePanel />
          <div className="flex flex-1 h-full overflow-hidden w-full min-w-0">
            <TenantSecondarySidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
              <main className="flex-1 overflow-auto relative z-10 custom-scrollbar bg-background">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
