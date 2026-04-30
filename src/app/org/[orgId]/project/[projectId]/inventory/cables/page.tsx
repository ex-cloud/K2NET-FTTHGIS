import React from "react";
import { Cable } from "lucide-react";

export default function CableManagementPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center">
      <div className="p-4 bg-blue-500/10 rounded-full mb-4">
        <Cable className="w-12 h-12 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Cable Management</h1>
      <p className="text-muted-foreground max-w-md">
        This module is currently under construction. Once completed, you will be able to manage physical cables, cores, and splicing documentation here.
      </p>
    </div>
  );
}
