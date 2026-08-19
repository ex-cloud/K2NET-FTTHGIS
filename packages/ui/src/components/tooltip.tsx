"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "../utils";

function TooltipProvider({
  delayDuration = 100,
  skipDelayDuration = 300,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

export interface TooltipContentProps
  extends React.ComponentProps<typeof TooltipPrimitive.Content> {
  showArrow?: boolean;
  shortcut?: string;
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  showArrow = false,
  shortcut,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground border border-border shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-lg px-2.5 py-1 text-[11px] font-medium tracking-tight pointer-events-none select-none flex items-center gap-2",
          className
        )}
        {...props}
      >
        <span>{children}</span>
        {shortcut && (
          <span className="text-[9px] text-muted-foreground font-mono bg-muted/60 px-1 py-0.5 rounded border border-border/60 uppercase shrink-0">
            {shortcut}
          </span>
        )}
        {showArrow && (
          <TooltipPrimitive.Arrow className="bg-popover fill-popover border-t border-l border-border z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

/**
 * All-in-one Linear-style Action Tooltip for fast, uniform tooltip usage across the entire project.
 * Example:
 * <ActionTooltip label="Create new project" shortcut="N">
 *   <button>...</button>
 * </ActionTooltip>
 */
export interface ActionTooltipProps {
  label: React.ReactNode;
  shortcut?: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
  disabled?: boolean;
}

function ActionTooltip({
  label,
  shortcut,
  children,
  side = "bottom",
  align = "center",
  sideOffset = 6,
  className,
  disabled = false,
}: ActionTooltipProps) {
  if (disabled) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        shortcut={shortcut}
        className={className}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export { 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent, 
  TooltipProvider,
  ActionTooltip 
};
