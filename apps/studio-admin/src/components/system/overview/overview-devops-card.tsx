import type { ReactNode } from "react";
import { Badge } from "@k2net/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { ArrowRight, ExternalLink, type LucideIcon } from "lucide-react";
import Link from "next/link";

interface OverviewDevOpsCardProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  icon: LucideIcon;
  iconClassName?: string;
  accentClassName?: string;
  children?: ReactNode;
  href?: string;
  actionLabel?: string;
  actionClassName?: string;
  isExternal?: boolean;
}

export function OverviewDevOpsCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  iconClassName,
  accentClassName,
  children,
  href,
  actionLabel,
  actionClassName,
  isExternal = false,
}: OverviewDevOpsCardProps) {
  const beamColor = accentClassName?.includes("text-sky") 
    ? "#0ea5e9" 
    : accentClassName?.includes("text-violet") 
    ? "#8b5cf6" 
    : accentClassName?.includes("text-teal") 
    ? "#14b8a6" 
    : accentClassName?.includes("text-rose") 
    ? "#f43f5e"
    : "#3ecf8e"; // Default Primary Green

  const content = (
    <Card animatedBeam beamColor={beamColor}>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          <span>{eyebrow}</span>
          <Icon className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-colors", iconClassName)} />
        </CardDescription>
        <CardTitle className={cn("mt-1 text-base font-bold text-foreground", accentClassName)}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {description ? <div className="text-[10px] text-muted-foreground">{description}</div> : null}
        {children ? <div className="mt-3">{children}</div> : null}
        {actionLabel && href ? (
          <div className="mt-4">
            <div className={cn("inline-flex items-center gap-1 text-[10px] transition-colors", actionClassName)}>
              {actionLabel}
              {isExternal ? <ExternalLink className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  if (href && !isExternal) {
    return <Link href={href} className="group block h-full">{content}</Link>;
  }

  if (href && isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="group block h-full">
        {content}
      </a>
    );
  }

  return content;
}

export function OverviewStatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return (
    <Badge
      className={cn(
        "border text-[9px] font-mono px-1.5 py-0 font-bold",
        tone === "success" && "bg-primary/10 text-primary border-primary/20",
        tone === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        tone === "danger" && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        tone === "neutral" && "bg-muted text-muted-foreground border-border"
      )}
    >
      {children}
    </Badge>
  );
}
