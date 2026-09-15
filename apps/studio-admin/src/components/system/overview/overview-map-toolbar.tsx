import { Button } from "@k2net/ui";
import { Minimize2, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";

interface MapToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onResetAll: () => void;
}

export function MapToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onResetAll,
}: MapToolbarProps) {
  return (
    <div className="flex justify-between items-start z-20 pointer-events-none">
      <div>
        <h4 className="text-sm font-semibold text-foreground pointer-events-auto flex items-center gap-2">
          <span>Infrastructure Dependency Map</span>
        </h4>
        <p className="mt-0.5 text-[10px] text-muted-foreground pointer-events-auto">
          3-Tier Enterprise SaaS Architecture. Traffic flows Edge ➔ Core/AI ➔ Storage ➔ Microservices.
        </p>
      </div>
      <div className="flex items-center gap-1 bg-popover/90 border border-border rounded-lg p-1 pointer-events-auto shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={onZoomIn}
          title="Zoom In (+)"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[9px] font-mono font-bold text-muted-foreground px-1 select-none">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={onZoomOut}
          title="Zoom Out (-)"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <div className="w-[1px] h-3 bg-border mx-0.5" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={onResetZoom}
          title="Reset Zoom (100%)"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
        <div className="w-[1px] h-3 bg-border mx-0.5" />
        <Button
          variant="ghost"
          className="h-6 px-2 text-[9px] font-medium text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
          onClick={onResetAll}
          title="Reset View & Node Positions"
        >
          <Minimize2 className="h-3 w-3" />
          <span>Reset</span>
        </Button>
      </div>
    </div>
  );
}
