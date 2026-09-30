import * as React from "react";
import { Network, HardDrive, Cpu } from "lucide-react";
import { useTranslation } from "@k2net/i18n";

interface BillingQuotasCardProps {
  usedOlts: number;
  effectiveMaxOlts: number;
  oltPct: number;
  usedOdps: number;
  effectiveMaxOdps: number;
  odpPct: number;
  usedStorageGb: number;
  maxStorageGb: number;
  storagePct: number;
}

export function BillingQuotasCard({
  usedOlts,
  effectiveMaxOlts,
  oltPct,
  usedOdps,
  effectiveMaxOdps,
  odpPct,
  usedStorageGb,
  maxStorageGb,
  storagePct,
}: BillingQuotasCardProps) {
  const { t, formatNumber } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-4 border-t border-border/60">
      <div className="lg:col-span-4 space-y-1">
        <h4 className="text-sm font-bold text-foreground">{t("billing.cost_control_quotas")}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("billing.cost_control_desc")}
        </p>
      </div>

      <div className="lg:col-span-8">
        <div className="rounded-xl border border-border bg-card/80 p-5 space-y-4 shadow-xs">
          {/* OLT Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5 text-primary" />
                <span>{t("billing.olt_capacity")}</span>
              </span>
              <span className="font-mono text-muted-foreground">
                {formatNumber(usedOlts)} / {formatNumber(effectiveMaxOlts)} OLT ({oltPct}%)
              </span>
            </div>
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden flex">
              <div className="bg-primary h-full transition-all duration-500" style={{ width: `${Math.min(100, oltPct)}%` }} />
            </div>
          </div>

          {/* ODP Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-primary" />
                <span>{t("billing.odp_capacity")}</span>
              </span>
              <span className="font-mono text-muted-foreground">
                {formatNumber(usedOdps)} / {formatNumber(effectiveMaxOdps)} ODP ({odpPct}%)
              </span>
            </div>
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden flex">
              <div className="bg-primary h-full transition-all duration-500" style={{ width: `${Math.min(100, odpPct)}%` }} />
            </div>
          </div>

          {/* Storage Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                <span>{t("billing.minio_storage")}</span>
              </span>
              <span className="font-mono text-muted-foreground">
                {formatNumber(usedStorageGb)} GB / {formatNumber(maxStorageGb)} GB ({storagePct}%)
              </span>
            </div>
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden flex">
              <div className="bg-primary h-full transition-all duration-500" style={{ width: `${Math.min(100, storagePct)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
