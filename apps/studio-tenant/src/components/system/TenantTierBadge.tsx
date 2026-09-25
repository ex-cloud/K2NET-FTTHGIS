import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ActionTooltip, cn } from "@k2net/ui";
import { Sparkles, Zap, Shield } from "lucide-react";

export type TenantTier = "starter" | "pro" | "enterprise" | "free" | "basic" | "business";

export interface TenantTierBadgeProps {
  tier?: TenantTier | string;
  showLink?: boolean;
  className?: string;
}

interface TierConfig {
  label: string;
  badgeClass: string;
  tooltipLabel: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const TIER_CONFIGS: Record<string, TierConfig> = {
  starter: {
    label: "Starter",
    badgeClass: "bg-muted/80 text-muted-foreground border-border/60 hover:bg-muted hover:border-border/80",
    tooltipLabel: "Paket Starter (Gratis) • Klik untuk upgrade",
    icon: Shield,
  },
  free: {
    label: "Free",
    badgeClass: "bg-muted/80 text-muted-foreground border-border/60 hover:bg-muted hover:border-border/80",
    tooltipLabel: "Paket Free • Klik untuk upgrade ke Pro",
    icon: Shield,
  },
  basic: {
    label: "Basic",
    badgeClass: "bg-muted/80 text-muted-foreground border-border/60 hover:bg-muted hover:border-border/80",
    tooltipLabel: "Paket Basic • Klik untuk upgrade",
    icon: Shield,
  },
  pro: {
    label: "Pro",
    badgeClass: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/40 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
    tooltipLabel: "Paket Pro Aktif • Klik untuk kelola kuota",
    icon: Zap,
  },
  business: {
    label: "Business",
    badgeClass: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/40 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
    tooltipLabel: "Paket Business Aktif • Kelola langganan",
    icon: Zap,
  },
  enterprise: {
    label: "Enterprise",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)] hover:bg-amber-500/20 hover:border-amber-500/40",
    tooltipLabel: "Enterprise SLA Plan • Klik untuk kelola lisensi",
    icon: Sparkles,
  },
};

export function TenantTierBadge({
  tier = "pro",
  showLink = true,
  className,
}: TenantTierBadgeProps) {
  const normalizedTier = (tier || "pro").toLowerCase();
  const config = TIER_CONFIGS[normalizedTier] || TIER_CONFIGS.pro;
  const Icon = config.icon;

  const badgeElement = (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-5 px-2 text-[10px] font-semibold uppercase tracking-wider rounded-full border transition-all duration-200 cursor-pointer select-none",
        config.badgeClass,
        className
      )}
    >
      {Icon && <Icon className="size-2.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );

  return (
    <ActionTooltip label={config.tooltipLabel} side="bottom">
      {showLink ? (
        <Link to="/billing" className="inline-flex focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-full">
          {badgeElement}
        </Link>
      ) : (
        badgeElement
      )}
    </ActionTooltip>
  );
}
