import * as React from "react";
import { PanelLeftDashed, PanelLeft } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@k2net/ui";

export type SidebarMode = "expanded" | "collapsed" | "hover";

interface TenantSidebarControlProps {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
}

export function TenantSidebarControl({
  mode,
  onModeChange,
}: TenantSidebarControlProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md cursor-pointer"
          title="Pengaturan Tampilan Sidebar"
        >
          <PanelLeftDashed className="h-4 w-4" />
          <span className="sr-only">Sidebar Mode</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="right"
        className="w-48 bg-card border-border shadow-lg p-1"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            Mode Tampilan Sidebar
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/60" />

          <DropdownMenuItem
            onClick={() => onModeChange("expanded")}
            className="flex items-center gap-2.5 px-2 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-muted/50"
          >
            <div className={`h-3 w-3 rounded-full border flex items-center justify-center ${mode === "expanded" ? "border-primary bg-primary/20" : "border-border"}`}>
              {mode === "expanded" && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </div>
            <span className={mode === "expanded" ? "text-primary font-bold" : "text-foreground"}>
              Lebar Penuh (Expanded)
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onModeChange("collapsed")}
            className="flex items-center gap-2.5 px-2 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-muted/50"
          >
            <div className={`h-3 w-3 rounded-full border flex items-center justify-center ${mode === "collapsed" ? "border-primary bg-primary/20" : "border-border"}`}>
              {mode === "collapsed" && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </div>
            <span className={mode === "collapsed" ? "text-primary font-bold" : "text-foreground"}>
              Ringkas (Collapsed)
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onModeChange("hover")}
            className="flex items-center gap-2.5 px-2 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-muted/50"
          >
            <div className={`h-3 w-3 rounded-full border flex items-center justify-center ${mode === "hover" ? "border-primary bg-primary/20" : "border-border"}`}>
              {mode === "hover" && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </div>
            <span className={mode === "hover" ? "text-primary font-bold" : "text-foreground"}>
              Meluas saat Hover
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
