import * as React from "react";
import { Badge, Button, Card } from "@k2net/ui";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageSquare,
  Network,
  Users,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import type { SubscriptionPlanInfo } from "./billing-types";

interface BillingEnterprisePlanCardProps {
  plan: SubscriptionPlanInfo;
  isCurrent: boolean;
  isDowngrade: boolean;
  onSelectPlan: (plan: SubscriptionPlanInfo) => void;
}

export function BillingEnterprisePlanCard({
  plan,
  isCurrent,
  isDowngrade,
  onSelectPlan,
}: BillingEnterprisePlanCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card
      glowingEffect
      className="relative rounded-xl p-4 md:p-5 transition-all duration-300 border-border bg-card/60 backdrop-blur-sm"
    >
      {/* Enterprise Header Badge & Subtitle */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary font-mono text-[9.5px] font-semibold tracking-wider uppercase px-2 py-0.5"
          >
            ENTERPRISE CORE TIER
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            Infrastruktur ISP Skala Besar (&gt;25 OLT / ISP Core)
          </span>
        </div>

        {isCurrent && (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 border border-border px-2 py-0.5 rounded-full font-mono">
            {t("billing.current_plan")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Title, Description, 3 Metrics Pills, Collapsible details */}
        <div className="lg:col-span-8 space-y-3">
          <div>
            <h4 className="text-base font-bold text-foreground tracking-tight">ENTERPRISE</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {plan.description || t("billing.enterprise_desc")}
            </p>
          </div>

          {/* 3 Horizontal Metric Highlight Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-border/70 bg-card/60 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-primary text-[11px] font-medium">
                <Network className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Maks. 25 OLT & 12k ODP</span>
              </div>
              <p className="text-[9.5px] text-muted-foreground">Pemetaan Skala Metropolitan</p>
            </div>

            <div className="rounded-lg border border-border/70 bg-card/60 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-primary text-[11px] font-medium">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">2k ODC & 25k Pelanggan</span>
              </div>
              <p className="text-[9.5px] text-muted-foreground">Distribusi Closure & FAT Aktif</p>
            </div>

            <div className="rounded-lg border border-border/70 bg-card/60 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-primary text-[11px] font-medium">
                <HardDrive className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">500 GB MinIO S3</span>
              </div>
              <p className="text-[9.5px] text-muted-foreground">Arsip Redaman & Berkas Teknis</p>
            </div>
          </div>

          {/* Collapsible Trigger */}
          <div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <span>{t("billing.enterprise_specs_toggle")}</span>
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5 transition-transform" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 transition-transform" />
              )}
            </button>

            {/* Collapsible Content */}
            {expanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2.5 mt-2.5 border-groove-t animate-in fade-in duration-200">
                {plan.features.map((feat) => (
                  <div key={feat.title} className="flex items-start gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium block text-[11px] text-foreground">
                        {feat.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground block leading-snug">
                        {feat.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Price & Action Buttons */}
        <div className="lg:col-span-4 flex flex-col sm:items-end justify-between space-y-3 pt-0.5 lg:border-groove-l lg:pl-5">
          <div className="text-left sm:text-right space-y-0.5">
            <span className="text-[9.5px] font-mono text-muted-foreground uppercase tracking-wider block">
              HARGA BERLANGGANAN:
            </span>
            <div className="flex items-baseline sm:justify-end gap-1">
              <span className="text-base font-bold font-mono text-foreground">{plan.price}</span>
              <span className="text-xs text-muted-foreground font-normal">{t("billing.per_month")}</span>
            </div>
          </div>

          <div className="w-full sm:w-60 space-y-2">
            <Button
              size="sm"
              disabled={isCurrent}
              onClick={() => !isCurrent && onSelectPlan(plan)}
              className={`w-full text-xs font-semibold h-8 rounded-md gap-1.5 ${
                isCurrent
                  ? "disabled:opacity-100 bg-muted/30 text-muted-foreground/80 border border-border font-medium cursor-not-allowed shadow-2xs"
                  : isDowngrade
                    ? "bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer"
              }`}
            >
              <span>{isCurrent ? t("billing.current_plan") : t("billing.upgrade_to", { planName: plan.name })}</span>
              {!isCurrent && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info("Silakan hubungi K2NET Enterprise Solution Team.")}
              className="w-full h-7.5 text-[11px] border-border bg-card/80 hover:bg-muted text-foreground font-medium gap-1.5 cursor-pointer rounded-md"
            >
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t("billing.contact_sales")}</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
