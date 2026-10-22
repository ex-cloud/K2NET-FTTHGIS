import * as React from "react";
import { MetricCard } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { MessageSquare, Mail, Smartphone, CheckCircle2 } from "lucide-react";
import type { MessageTemplate } from "@/hooks/useMessageTemplates";

interface TemplateKpiCardsProps {
  templates: MessageTemplate[];
  loading?: boolean;
}

export function TemplateKpiCards({ templates, loading }: TemplateKpiCardsProps) {
  const { t } = useTranslation();

  const total = templates.length;
  const emailCount = templates.filter((tpl) => tpl.channel === "EMAIL" || tpl.channel === "ALL").length;
  const waCount = templates.filter((tpl) => tpl.channel === "WHATSAPP" || tpl.channel === "ALL").length;
  const activeCount = templates.filter((tpl) => tpl.active).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        variant="groove"
        loading={loading}
        label={t("billing.templates_kpi_total")}
        value={total}
        icon={MessageSquare}
        description={t("billing.templates_kpi_total_desc")}
      />
      <MetricCard
        variant="groove"
        loading={loading}
        label={t("billing.templates_kpi_email")}
        value={emailCount}
        icon={Mail}
        description={t("billing.templates_kpi_email_desc")}
      />
      <MetricCard
        variant="groove"
        loading={loading}
        label={t("billing.templates_kpi_whatsapp")}
        value={waCount}
        icon={Smartphone}
        description={t("billing.templates_kpi_whatsapp_desc")}
      />
      <MetricCard
        variant="groove"
        loading={loading}
        label={t("billing.templates_kpi_active_steps")}
        value={activeCount}
        icon={CheckCircle2}
        description={t("billing.templates_kpi_active_steps_desc")}
      />
    </div>
  );
}
