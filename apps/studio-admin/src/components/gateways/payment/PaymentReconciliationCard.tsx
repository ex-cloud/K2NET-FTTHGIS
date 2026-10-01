import React from "react";
import { RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface PaymentReconciliationCardProps {
  reconciling: boolean;
  onReconciliation: () => void;
}

export function PaymentReconciliationCard({ reconciling, onReconciliation }: PaymentReconciliationCardProps) {
  const { t } = useTranslation();

  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("gateways.payment.manual_reconcile")}
        </CardTitle>
        <CardDescription className="text-[10px] text-muted-foreground">
          {t("gateways.payment.manual_reconcile_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ActionTooltip label={t("gateways.payment.trigger_reconcile")} shortcut="R">
          <Button
            type="button"
            onClick={onReconciliation}
            disabled={reconciling}
            variant="outline"
            className="w-full border-border/10 hover:border-primary/30 bg-background text-muted-foreground hover:text-foreground text-xs gap-2 transition-all py-5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? "animate-spin text-primary" : ""}`} />
            {t("gateways.payment.trigger_reconcile")}
          </Button>
        </ActionTooltip>
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{t("gateways.payment.last_auto_reconcile")}: 15m ago</span>
        </div>
      </CardContent>
    </Card>
  );
}
