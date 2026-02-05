import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";
import { TopHeader } from "@/components/dashboard/top-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500 overflow-hidden">
        {/* Global Background Grid Pattern - Behind everything */}
        <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.03] pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] z-0" />

        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-transparent transition-colors duration-500 relative overflow-visible">
            <TopHeader />

            <div className="flex flex-1 flex-col overflow-auto relative z-10">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </SessionProvider>
  );
}
