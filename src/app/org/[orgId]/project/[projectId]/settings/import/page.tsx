import React from "react";
import { UploadCloud } from "lucide-react";

export default function GISDataImportPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center">
      <div className="p-4 bg-orange-500/10 rounded-full mb-4">
        <UploadCloud className="w-12 h-12 text-orange-500" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">GIS Data Import (Phase 5)</h1>
      <p className="text-muted-foreground max-w-md">
        This module is currently under construction. Once completed, you will be able to bulk import GeoJSON, KML, and ESRI Shapefiles directly into the FTTH database.
      </p>
    </div>
  );
}
