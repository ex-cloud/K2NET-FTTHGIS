import * as React from "react";
import { Button, ActionTooltip } from "@k2net/ui";
import { Map, Radio, MessageSquare, Sparkles, ExternalLink } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "../types";

interface OrgCardFooterProps {
  organization: EnrichedOrganization;
  onImpersonate: (org: EnrichedOrganization) => void;
}

export function OrgCardFooter({ organization: org, onImpersonate }: OrgCardFooterProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center justify-between pt-2 border-t border-border/40 w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 text-muted-foreground">
        <ActionTooltip label={t("organizations.gis_spatial_core")}>
          <div className={cn("p-1 rounded", org.featureFlags.gisCore ? "text-primary" : "opacity-30")}>
            <Map className="h-3 w-3" />
          </div>
        </ActionTooltip>
        <ActionTooltip label={t("organizations.olt_snmp_poller")}>
          <div className={cn("p-1 rounded", org.featureFlags.oltPoller ? "text-primary bg-primary/10" : "opacity-30")}>
            <Radio className="h-3 w-3" />
          </div>
        </ActionTooltip>
        <ActionTooltip label={t("organizations.whatsapp_billing_engine")}>
          <div className={cn("p-1 rounded", org.featureFlags.whatsappEngine ? "text-blue-500" : "opacity-30")}>
            <MessageSquare className="h-3 w-3" />
          </div>
        </ActionTooltip>
        <ActionTooltip label={t("organizations.ai_fiber_routing_copilot")}>
          <div className={cn("p-1 rounded", org.featureFlags.aiCopilot ? "text-purple-500" : "opacity-30")}>
            <Sparkles className="h-3 w-3" />
          </div>
        </ActionTooltip>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onImpersonate(org)}
        className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 px-2 font-medium"
      >
        <span>{t("organizations.open_portal")}</span>
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );
}
