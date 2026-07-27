"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { cn } from "../utils";

function CommandPaletteRoot({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[20%] z-50 w-full max-w-2xl translate-x-[-50%] p-0 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-150">
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function CommandPaletteInput({
  value,
  onValueChange,
  placeholder = "Search tenants, pages, or commands...",
}: {
  value: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center border-b border-border/80 px-4 py-3 gap-3">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none font-medium"
        autoFocus
      />
      <kbd className="pointer-events-none select-none rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
        ESC
      </kbd>
    </div>
  );
}

function CommandPaletteGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2 px-2">
      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
        {heading}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function CommandPaletteItem({
  children,
  onSelect,
  active = false,
  icon: Icon,
  badgeText,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  active?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  badgeText?: string;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors duration-150 select-none",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />}
        <span className="truncate">{children}</span>
      </div>
      {badgeText && (
        <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded border border-border/60 bg-muted/30 text-muted-foreground shrink-0">
          {badgeText}
        </span>
      )}
    </div>
  );
}

export {
  CommandPaletteRoot,
  CommandPaletteInput,
  CommandPaletteGroup,
  CommandPaletteItem,
};
