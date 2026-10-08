import * as React from "react";
import { cn } from "@/lib/utils";

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  cardClassName?: string;
  divider?: boolean;
  noCardWrapper?: boolean;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
  cardClassName,
  divider = true,
  noCardWrapper = false,
}: SettingsSectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Column: Keterangan (Title & Description) */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-1.5">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Right Column: Card Container with Form Rows & Content */}
        <div className="flex-1 w-full min-w-0">
          {noCardWrapper ? (
            children
          ) : (
            <div className={cn("border border-border/80 rounded-xl bg-card p-4 sm:p-5 shadow-xs", cardClassName)}>
              {children}
            </div>
          )}
        </div>
      </div>

      {divider && <div className="h-[1px] w-full bg-border/60" />}
    </div>
  );
}
