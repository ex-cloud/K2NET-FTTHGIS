import React from "react";
import { Construction } from "lucide-react";

export default function BOQGeneratorPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center">
      <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
        <Construction className="w-12 h-12 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">BOQ Generator (Phase 6)</h1>
      <p className="text-muted-foreground max-w-md">
        This module is currently under construction. Once completed, you will be able to automatically generate Bill of Quantities reports based on the GIS network data.
      </p>
    </div>
  );
}
