import React from "react";
import { Users } from "lucide-react";

export default function TeamSettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center">
      <div className="p-4 bg-purple-500/10 rounded-full mb-4">
        <Users className="w-12 h-12 text-purple-500" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Project Members</h1>
      <p className="text-muted-foreground max-w-md">
        Manage project members and specific permissions here.
      </p>
    </div>
  );
}
