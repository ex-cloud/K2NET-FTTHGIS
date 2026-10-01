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
          <div className="flex items-center gap-1 shrink-0">
            {shortcut.includes(" then ") ? (
              shortcut.split(" then ").map((key, i, arr) => (
                <React.Fragment key={i}>
                  <span className="text-[9px] text-muted-foreground font-mono bg-muted/60 px-1 py-0.5 rounded border border-border/60 uppercase">
                    {key.trim()}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="text-[9px] text-muted-foreground/70 font-sans lowercase">then</span>
                  )}
                </React.Fragment>
              ))
            ) : (
              <span className="text-[9px] text-muted-foreground font-mono bg-muted/60 px-1 py-0.5 rounded border border-border/60 uppercase">
                {shortcut}
              </span>
            )}
          </div>
        )}
        {showArrow && (
          <TooltipPrimitive.Arrow className="bg-popover fill-popover border-t border-l border-border z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

// ─── Shortcut key matching helpers ───────────────────────────────────────────

// Track sequential shortcut leader key (e.g., user pressed "g" or "s")
let activeLeaderKey = "";
let leaderKeyTimeout: ReturnType<typeof setTimeout> | null = null;

if (typeof window !== "undefined") {
  window.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      // Don't capture leader keys if typing in an input
      if (isInputTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (["shift", "control", "alt", "meta", "capslock", "tab", "escape", "enter"].includes(key)) {
        return;
      }

      // If leader key pressed (e.g., 'g' or 's')
      if (key === "g" || key === "s") {
        activeLeaderKey = key;
        if (leaderKeyTimeout) clearTimeout(leaderKeyTimeout);
        leaderKeyTimeout = setTimeout(() => {
          activeLeaderKey = "";
        }, 1500);
      }
    },
    { capture: true }
  );
}

function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  if (!shortcut) return false;
  const parts = shortcut.toLowerCase().split("+").map((s) => s.trim());
  const needsCtrl = parts.includes("ctrl") || parts.includes("control");
  const needsMeta = parts.includes("meta") || parts.includes("cmd") || parts.includes("command");
  const needsAlt = parts.includes("alt") || parts.includes("option") || parts.includes("opt");
  const needsShift = parts.includes("shift");

  const keyPart = parts.find(
    (p) => !["ctrl", "control", "meta", "cmd", "command", "alt", "option", "opt", "shift"].includes(p)
  );

  if (!keyPart) return false;

  const hasCtrlOrMeta = e.ctrlKey || e.metaKey;
  if ((needsCtrl || needsMeta) && !hasCtrlOrMeta) return false;
  if (!needsCtrl && !needsMeta && (e.ctrlKey || e.metaKey)) return false;

  if (needsAlt && !e.altKey) return false;
  if (!needsAlt && e.altKey) return false;

  if (needsShift && !e.shiftKey) return false;

  const eventKey = e.key.toLowerCase();
  if (keyPart === "esc" || keyPart === "escape") {
    return eventKey === "escape";
  }
  if (keyPart === "enter" || keyPart === "return") {
    return eventKey === "enter";
  }
  if (keyPart === "del" || keyPart === "delete") {
    return eventKey === "delete";
  }

  return eventKey === keyPart;
}

function isInputTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

/**
 * All-in-one Linear-style Action Tooltip for fast, uniform tooltip usage across the entire project.
 * Automatically wires up keyboard shortcuts to execute the wrapped button onClick!
 * 
 * Example:
 * <ActionTooltip label="Create new project" shortcut="C">
 *   <button onClick={...}>...</button>
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
  enableGlobalShortcut?: boolean;
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
  enableGlobalShortcut = true,
}: ActionTooltipProps) {
  const elementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!shortcut || !enableGlobalShortcut || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const el = elementRef.current;
      if (!el || !document.body.contains(el)) return;

      // Don't trigger if element is disabled or hidden
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") {
        return;
      }
      if (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) {
        return;
      }

      // 1. Sequential Shortcuts (e.g. "G then O", "S then 1")
      if (shortcut.includes(" then ")) {
        const parts = shortcut.toLowerCase().split(" then ").map((s) => s.trim());
        if (parts.length === 2) {
          const [leader, secondKey] = parts;
          const currentKey = e.key.toLowerCase();

          if (activeLeaderKey === leader && currentKey === secondKey) {
            if (isInputTarget(e.target)) return;

            e.preventDefault();
            e.stopPropagation();
            activeLeaderKey = "";
            if (leaderKeyTimeout) clearTimeout(leaderKeyTimeout);

            // Execute click on target element or interactive child
            const interactiveEl = (el.querySelector("button, a, input") as HTMLElement) || el;
            interactiveEl.click();
            return;
          }
        }
        return;
      }

      // 2. Modifier & Single Key Shortcuts (e.g. "⌘K", "Ctrl+J", "N", "R")
      if (matchesShortcut(e, shortcut)) {
        const parts = shortcut.toLowerCase().split("+").map((s) => s.trim());
        const hasModifier = parts.some((p) =>
          ["ctrl", "control", "meta", "cmd", "command", "alt", "option", "opt"].includes(p)
        );
        const isEsc = parts.includes("esc") || parts.includes("escape");

        if (!hasModifier && !isEsc && isInputTarget(e.target)) {
          return;
        }

        // If leader key is active, don't trigger single-key shortcut clash
        if (activeLeaderKey && !hasModifier) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        const interactiveEl = (el.querySelector("button, a, input") as HTMLElement) || el;
        interactiveEl.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcut, enableGlobalShortcut, disabled]);

  if (disabled) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger
        asChild
        ref={(node: HTMLElement | null) => {
          elementRef.current = node;
        }}
      >
        {children}
      </TooltipTrigger>
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
