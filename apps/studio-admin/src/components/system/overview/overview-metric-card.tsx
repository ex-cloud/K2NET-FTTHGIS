import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Link } from "@/lib/navigation-compat";
import { ArrowRight } from "lucide-react";
import type { OverviewMetricCardProps } from "./overview-types";
import { cn } from "@/lib/utils";

export function OverviewMetricCard({
  eyebrow,
  value,
  helper,
  footer,
  icon: Icon,
  iconClassName,
  accentClassName,
  footerLinkHref,
  footerLinkLabel,
  className,
}: OverviewMetricCardProps) {
  const _beamColor = accentClassName?.includes("text-sky") 
    ? "#0ea5e9" 
    : accentClassName?.includes("text-violet") 
    ? "#8b5cf6" 
    : accentClassName?.includes("text-teal") 
    ? "#14b8a6" 
    : accentClassName?.includes("text-rose") 
    ? "#f43f5e"
    : "#3ecf8e"; // Default Primary Green

  return (
    <Card glowingEffect className={cn("flex flex-col justify-between transition-all duration-200", className)}>
      <CardHeader className="p-2.5 sm:p-3.5 pb-1 sm:pb-1.5">
        {/* Eyebrow Label & Icon */}
        <CardDescription className="flex items-center justify-between text-[10px] sm:text-xs uppercase font-semibold tracking-wider text-muted-foreground/90">
          <span className="truncate mr-1 min-w-0 font-medium">{eyebrow}</span>
          <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary", iconClassName)} />
        </CardDescription>
        {/* Main Metric Value */}
        <CardTitle className={cn("mt-1 text-lg sm:text-xl @[200px]/card:text-2xl font-bold text-foreground tracking-tight flex items-baseline flex-wrap gap-1.5", accentClassName)}>{value}</CardTitle>
      </CardHeader>
      <CardContent className="p-2.5 sm:p-3.5 pt-0 sm:pt-0 pb-2.5 sm:pb-3">
        {/* Helper Description */}
        <div className="text-[10px] sm:text-xs text-muted-foreground/80 truncate min-w-0">{helper}</div>
        {/* Footer & Action Link */}
        <div className="mt-1.5 sm:mt-2.5 flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground border-t border-border/30 pt-1.5 sm:pt-2">
          <span className="truncate mr-1 hidden @[220px]/card:inline min-w-0 text-muted-foreground/70">{footer}</span>
          {footerLinkHref ? (
            <Link href={footerLinkHref} className="flex items-center gap-0.5 transition-colors shrink-0 ml-auto @[220px]/card:ml-0 font-medium text-foreground/85 hover:text-primary">
              {footerLinkLabel} <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5" />
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
