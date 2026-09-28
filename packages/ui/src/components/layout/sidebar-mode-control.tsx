import * as React from "react";
import { PanelLeftDashed } from "lucide-react";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { cn } from "../../utils";
import { useSidebarMode, type SidebarMode } from "./sidebar-mode-context";

export interface SidebarModeControlProps {
  mode?: SidebarMode;
  onModeChange?: (mode: SidebarMode) => void;
  isExpanded?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function SidebarModeControl({
  mode: controlledMode,
  onModeChange: controlledOnModeChange,
  className,
  triggerClassName,
}: SidebarModeControlProps) {
  const context = useSidebarMode();

  const mode = controlledMode ?? context.sidebarMode;
  const handleModeChange = controlledOnModeChange ?? context.setSidebarMode;

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-md cursor-pointer",
              triggerClassName
            )}
          >
            <PanelLeftDashed className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="sr-only">Sidebar Control</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="right"
          className="w-48 bg-popover border-border shadow-lg p-1 animate-in fade-in zoom-in duration-200"
          sideOffset={10}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-2 text-[9px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-[0.2em]">
              Display Mode
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => handleModeChange("expanded")}
              className="flex items-center gap-3 px-2 py-2.5 focus:bg-primary/10 cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                  mode === "expanded"
                    ? "border-primary bg-primary/20"
                    : "border-border bg-transparent"
                )}
              >
                {mode === "expanded" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  mode === "expanded"
                    ? "text-primary"
                    : "text-foreground/80 dark:text-muted-foreground group-hover:text-foreground"
                )}
              >
                Expanded
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleModeChange("collapsed")}
              className="flex items-center gap-3 px-2 py-2.5 focus:bg-primary/10 cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                  mode === "collapsed"
                    ? "border-primary bg-primary/20"
                    : "border-border bg-transparent"
                )}
              >
                {mode === "collapsed" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  mode === "collapsed"
                    ? "text-primary"
                    : "text-foreground/80 dark:text-muted-foreground group-hover:text-foreground"
                )}
              >
                Collapsed
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleModeChange("hover")}
              className="flex items-center gap-3 px-2 py-2.5 focus:bg-primary/10 cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                  mode === "hover"
                    ? "border-primary bg-primary/20"
                    : "border-border bg-transparent"
                )}
              >
                {mode === "hover" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    mode === "hover"
                      ? "text-primary"
                      : "text-foreground/80 dark:text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  Expand on Hover
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-medium">
                  Reveals on mouse enter
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { type SidebarMode };
