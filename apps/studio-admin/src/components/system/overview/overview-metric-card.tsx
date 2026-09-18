import { Card } from "@k2net/ui";
import { Link } from "@/lib/navigation-compat";
import { ArrowRight } from "lucide-react";
import type { OverviewMetricCardProps } from "./overview-types";
import { cn } from "@/lib/utils";

export function OverviewMetricCard({
  eyebrow,
  eyebrowBadge,
  value,
  helper,
  secondaryStats,
  footer,
  icon: Icon,
  iconClassName,
  accentClassName,
  footerLinkHref,
  footerLinkLabel,
  className,
}: OverviewMetricCardProps) {
  return (
    <Card
      glowingEffect
      className={cn(
        "flex flex-col justify-between transition-all duration-200 p-0 overflow-hidden",
        className
      )}
    >
      <div className="p-3.5 sm:p-4 pb-1.5 flex flex-col justify-between">
        {/* Top Header Row: Eyebrow + Optional Badge + Icon Box */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] sm:text-xs uppercase font-semibold tracking-wider text-muted-foreground/90 truncate">
              {eyebrow}
            </span>
            {eyebrowBadge}
          </div>
          <div className="p-1 sm:p-1.5 rounded-lg bg-muted/40 border border-border/40 text-muted-foreground/80 shrink-0">
            <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors group-hover:text-primary", iconClassName)} />
          </div>
        </div>

        {/* Main Metric Value Row */}
        <div className={cn("mt-2 text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-baseline flex-wrap gap-2", accentClassName)}>
          {value}
        </div>
      </div>

      {/* Helper Stats & Footer Link */}
      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 flex flex-col gap-2">
        {/* Secondary Specs / Stats Row */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground font-medium">
          <span className="truncate min-w-0">{helper}</span>
          {secondaryStats ? <span className="shrink-0 ml-2">{secondaryStats}</span> : null}
        </div>

        {/* Footer Action Bar */}
        <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
          <span className="truncate mr-1 hidden @[220px]/card:inline min-w-0 text-muted-foreground/70">
            {footer}
          </span>
          {footerLinkHref ? (
            <Link
              href={footerLinkHref}
              className="flex items-center gap-1 transition-colors shrink-0 ml-auto @[220px]/card:ml-0 font-medium text-foreground/85 hover:text-primary"
            >
              {footerLinkLabel} <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
