"use client";

import { OrgSettingsSidebar } from "@/components/org-settings-sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 h-full overflow-hidden w-full">
      {/* Secondary Contextual Sidebar for Settings */}
      <OrgSettingsSidebar />
      
      {/* Main Settings Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-auto relative z-10 custom-scrollbar bg-[#080808]">
          {children}
        </main>
      </div>
    </div>
  );
}
