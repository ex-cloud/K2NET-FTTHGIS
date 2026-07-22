import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import Link from "next/link";
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
  const hoverBorderClass = accentClassName?.includes("text-primary") 
    ? "hover:border-primary/20" 
    : accentClassName?.includes("text-sky") 
    ? "hover:border-sky-500/20" 
    : accentClassName?.includes("text-violet") 
    ? "hover:border-violet-500/20" 
    : accentClassName?.includes("text-teal") 
    ? "hover:border-teal-500/20" 
    : accentClassName?.includes("text-rose") 
    ? "hover:border-rose-500/20"
    : eyebrow.toLowerCase().includes("tenant") || eyebrow.toLowerCase().includes("gateway")
    ? "hover:border-primary/20"
    : "hover:border-zinc-500/20";

  return (
    <Card className={cn("group h-full bg-card border-border transition-all duration-300", hoverBorderClass)}>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          <span>{eyebrow}</span>
          <Icon className={cn("w-3.5 h-3.5 text-muted-foreground/60 transition-colors group-hover:text-primary", iconClassName)} />
        </CardDescription>
        <CardTitle className={cn("mt-1 text-2xl font-bold text-foreground", accentClassName)}>{value}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-[10px] text-muted-foreground">{helper}</div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{footer}</span>
          {footerLinkHref ? (
            <Link href={footerLinkHref} className="flex items-center gap-0.5 transition-colors hover:text-primary">
              {footerLinkLabel} <ArrowRight className="h-3 w-3" />
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
