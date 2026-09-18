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
    <Card glowingEffect className="flex flex-col justify-between">
      <CardHeader className="p-3 sm:p-5 pb-1.5 sm:pb-2">
        {/* CardDescription: eyebrow label + icon.
            Uses container query: at card width < 180px (mobile 2-col grid),
            the eyebrow font shrinks to [8px] and icon is hidden to preserve space. */}
        <CardDescription className="flex items-center justify-between text-[9px] @[180px]/card:text-[10px] uppercase font-bold tracking-wider text-foreground/75 dark:text-muted-foreground">
          <span className="truncate mr-1 min-w-0">{eyebrow}</span>
          <Icon className={cn("w-3 h-3 @[180px]/card:w-3.5 @[180px]/card:h-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary", iconClassName)} />
        </CardDescription>
        {/* CardTitle: main metric value.
            Container query scales font from text-base (tiny card) to text-2xl (wide card). */}
        <CardTitle className={cn("mt-1 text-base @[160px]/card:text-lg @[220px]/card:text-2xl font-bold text-foreground tracking-tight", accentClassName)}>{value}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 pb-3 sm:pb-4">
        <div className="text-[9px] @[180px]/card:text-[10px] text-muted-foreground truncate min-w-0">{helper}</div>
        <div className="mt-2 sm:mt-3 flex items-center justify-between text-[9px] @[180px]/card:text-[10px] text-muted-foreground border-t border-border/40 pt-2">
          <span className="truncate mr-1 hidden @[200px]/card:inline min-w-0">{footer}</span>
          {footerLinkHref ? (
            <Link href={footerLinkHref} className="flex items-center gap-0.5 transition-colors hover:text-primary shrink-0 ml-auto @[200px]/card:ml-0 font-medium text-foreground/80 hover:text-primary">
              {footerLinkLabel} <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
