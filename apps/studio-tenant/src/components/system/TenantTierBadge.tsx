import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ActionTooltip, cn } from "@k2net/ui";
import { Sparkles, Zap, Shield } from "lucide-react";
import { useTenantInfo } from "../../hooks/useTenantInfo";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";

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
    label: "STARTER",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/40",
    tooltipLabel: "Paket Starter Aktif (Rp 990k/bln) • Klik untuk kelola kuota",
    icon: Shield,
  },
  free: {
    label: "TRIAL",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
    tooltipLabel: "Starter Trial 14 Hari • Klik untuk upgrade paket",
    icon: Shield,
  },
  trial: {
    label: "TRIAL",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
    tooltipLabel: "Starter Trial 14 Hari • Klik untuk upgrade paket",
    icon: Shield,
  },
  basic: {
    label: "BASIC",
    badgeClass: "bg-muted/80 text-muted-foreground border-border/60 hover:bg-muted hover:border-border/80",
    tooltipLabel: "Paket Basic • Klik untuk upgrade",
    icon: Shield,
  },
  pro: {
    label: "PRO",
    badgeClass: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/40 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
    tooltipLabel: "Paket Pro Aktif • Klik untuk kelola kuota",
    icon: Zap,
  },
  professional: {
    label: "PRO",
    badgeClass: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/40 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
    tooltipLabel: "Paket Professional Aktif • Klik untuk kelola kuota",
    icon: Zap,
  },
  business: {
    label: "BUSINESS",
    badgeClass: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/40 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
    tooltipLabel: "Paket Business Aktif • Kelola langganan",
    icon: Zap,
  },
  enterprise: {
    label: "ENTERPRISE",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)] hover:bg-purple-500/20 hover:border-purple-500/40",
    tooltipLabel: "Enterprise SLA Plan • Klik untuk kelola lisensi",
    icon: Sparkles,
  },
};

export function TenantTierBadge({
  tier,
  showLink = true,
  className,
}: TenantTierBadgeProps) {
  const { planTier: infoTier } = useTenantInfo();
  const { tier: subTier } = useTenantSubscription();
  const effectiveTier = tier ?? subTier ?? infoTier;

  const normalizedTier = (effectiveTier || "free").toLowerCase();
  const config = TIER_CONFIGS[normalizedTier] || TIER_CONFIGS.free;
  const Icon = config.icon;

  const badgeElement = (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 h-3.5 px-1.5 text-[8px] font-semibold uppercase tracking-wide rounded-full border transition-all duration-200 cursor-pointer select-none",
        config.badgeClass,
        className
      )}
    >
      {Icon && <Icon className="size-2 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );

  return (
    <ActionTooltip label={config.tooltipLabel} side="bottom">
      {showLink ? (
        <Link
          to="/billing"
          className="inline-flex focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-full"
        >
          {badgeElement}
        </Link>
      ) : (
        badgeElement
      )}
    </ActionTooltip>
  );
}
