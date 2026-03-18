import { ProjectSidebar } from "@/components/project-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

export default async function OrganizationContextLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return (
    <div
      className="flex h-full w-full overflow-hidden bg-background"
      data-org-id={orgId}
    >
      <ProjectSidebar className="border-r border-border hidden md:block z-20 shrink-0" />
      <SidebarInset className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        <main className="flex-1 overflow-auto relative p-0">{children}</main>
      </SidebarInset>
    </div>
  );
}
