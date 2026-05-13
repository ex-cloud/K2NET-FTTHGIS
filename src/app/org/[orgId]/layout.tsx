"use client";

import { MainSidebar } from "@/components/main-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
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
  const { setOrganizationSuspended } = useUIStore();

  useEffect(() => {
    if (params?.orgId && organizations.length > 0) {
      const currentOrg = organizations.find((org) => org.slug === params.orgId);
      if (currentOrg && (currentOrg.status === 'SUSPENDED' || currentOrg.status === 'TRIAL_EXPIRED')) {
        setOrganizationSuspended(true);
      } else {
        setOrganizationSuspended(false);
      }
    }
  }, [params?.orgId, organizations, setOrganizationSuspended]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background relative">
      <MainSidebar />
      <div className="flex-1 flex min-w-0 overflow-hidden">
        <SidebarProvider open={open} onOpenChange={setOpen}>
          <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
            {children}
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
