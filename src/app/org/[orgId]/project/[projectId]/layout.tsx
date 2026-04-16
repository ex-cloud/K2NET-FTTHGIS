import { ProjectSidebar } from "@/components/project-sidebar";
import { RealTimeNotificationClient } from "@/components/real-time-notification-client";
import { DetailSlidePanel } from "@/components/dashboard/detail-slide-panel";
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RealTimeNotificationClient />
      <DetailSlidePanel />
      
      {/* Container for Secondary Sidebar and Main Content */}
      <div className="flex flex-1 h-full overflow-hidden w-full">
        {/* Secondary Contextual Sidebar */}
        <ProjectSidebar />
        
        {/* Main Project Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <main className="flex-1 overflow-auto relative z-10 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
