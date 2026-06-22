"use client";

import * as React from "react";

export function MapCanvas() {
  return (
    <div className="relative w-full h-full bg-zinc-100 dark:bg-zinc-900 border overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">
            Map Visualization Layer
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            MapLibre GL JS will render here
          </p>
        </div>
      </div>

      {/* Floating Toolbar Placeholder */}
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur border rounded-md p-2 shadow-sm flex flex-col gap-2">
        <div className="size-8 bg-primary/10 rounded items-center justify-center flex text-xs">
          Layer
        </div>
        <div className="size-8 bg-primary/10 rounded items-center justify-center flex text-xs">
          Filter
        </div>
      </div>
    </div>
  );
}
