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
  return (
    <Card className="group h-full bg-card/60 border-border backdrop-blur-md transition-all duration-300 hover:border-primary/20">
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-zinc-500">
          <span>{eyebrow}</span>
          <Icon className={cn("w-3.5 h-3.5 text-zinc-600 transition-colors group-hover:text-primary", iconClassName)} />
        </CardDescription>
        <CardTitle className={cn("mt-1 text-2xl font-light text-zinc-200", accentClassName)}>{value}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-[10px] text-zinc-500">{helper}</div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500">
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
