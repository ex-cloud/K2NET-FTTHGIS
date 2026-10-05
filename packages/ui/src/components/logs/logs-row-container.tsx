import * as React from "react";
import { Checkbox } from "../checkbox";
import { cn } from "../../utils";

export interface LogsRowContainerProps {
  id?: string;
  isSelected?: boolean;
  isActive?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function LogsRowContainer({
  isSelected = false,
  isActive = false,
  onToggleSelect,
  onClick,
  className,
  children,
}: LogsRowContainerProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center px-4 py-1.5 text-xs font-mono transition-colors group cursor-pointer border-b border-border/20 select-none",
        isActive
          ? "bg-primary/10 border-primary/30 text-foreground"
          : isSelected
          ? "bg-muted/70 text-foreground"
          : "hover:bg-muted/40 text-foreground/90 hover:text-foreground",
        className
      )}
    >
      {onToggleSelect && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(e);
          }}
          className="w-[20px] mr-2.5 shrink-0 flex items-center justify-center cursor-pointer"
        >
          <Checkbox
            checked={isSelected}
            className="size-3.5 rounded-[3px]"
            aria-label="Select row"
          />
        </div>
      )}
      {children}
    </div>
  );
}
