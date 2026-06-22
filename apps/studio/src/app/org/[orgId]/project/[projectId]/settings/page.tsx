import React from "react";
import { Settings2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center">
      <div className="p-4 bg-muted/50 rounded-full mb-4">
        <Settings2 className="w-12 h-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Project Settings</h1>
      <p className="text-muted-foreground max-w-md">
        Manage your project configuration, team members, and GIS data imports from the sidebar.
      </p>
    </div>
  );
}
