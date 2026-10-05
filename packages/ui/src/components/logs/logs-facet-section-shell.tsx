import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils";

export interface LogsFacetSectionShellProps {
  title: React.ReactNode;
  activeLabel?: string | null;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function LogsFacetSectionShell({
  title,
  activeLabel,
  defaultOpen = true,
  className,
  children,
}: LogsFacetSectionShellProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("w-full space-y-1 pt-2.5 border-groove-t select-none", className)}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-medium text-foreground/70 dark:text-muted-foreground/80 uppercase tracking-widest hover:text-foreground group select-none cursor-pointer">
        <span>{title}</span>
        <div className="flex items-center gap-1.5">
          {activeLabel && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono font-medium max-w-[100px] truncate border border-border/40">
              {activeLabel}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/60 group-hover:text-foreground dark:text-muted-foreground/70" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 space-y-1 font-mono text-[11px]">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
