import * as React from "react";
import { ActionTooltip } from "@k2net/ui";
import { Map, Radio, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "../types";

interface OrgTableFlagsCellProps {
  organization: EnrichedOrganization;
}

export function OrgTableFlagsCell({ organization: org }: OrgTableFlagsCellProps) {
  return (
    <div className="flex items-center gap-1.5">
      <ActionTooltip label={`GIS Spatial Core: ${org.featureFlags.gisCore ? "Enabled" : "Disabled"}`}>
        <div className={cn("p-1 rounded", org.featureFlags.gisCore ? "text-primary bg-primary/10" : "text-muted-foreground/40")}>
          <Map className="h-3 w-3" />
        </div>
      </ActionTooltip>

      <ActionTooltip label={`OLT Poller Gateway: ${org.featureFlags.oltPoller ? "Enabled" : "Disabled"}`}>
        <div className={cn("p-1 rounded", org.featureFlags.oltPoller ? "text-primary bg-primary/10" : "text-muted-foreground/40")}>
          <Radio className="h-3 w-3" />
        </div>
      </ActionTooltip>

      <ActionTooltip label={`WhatsApp Billing Engine: ${org.featureFlags.whatsappEngine ? "Enabled" : "Disabled"}`}>
        <div className={cn("p-1 rounded", org.featureFlags.whatsappEngine ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground/40")}>
          <MessageSquare className="h-3 w-3" />
        </div>
      </ActionTooltip>

      <ActionTooltip label={`AI Fiber Routing Copilot: ${org.featureFlags.aiCopilot ? "Enabled" : "Disabled"}`}>
        <div className={cn("p-1 rounded", org.featureFlags.aiCopilot ? "text-purple-500 bg-purple-500/10" : "text-muted-foreground/40")}>
          <Sparkles className="h-3 w-3" />
        </div>
      </ActionTooltip>
    </div>
  );
}
