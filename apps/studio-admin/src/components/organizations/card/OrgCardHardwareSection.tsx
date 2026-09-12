import * as React from "react";
import { ActionTooltip } from "@k2net/ui";
import { Network, Globe, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "../types";

interface OrgCardHardwareSectionProps {
  organization: EnrichedOrganization;
}

export function OrgCardHardwareSection({ organization: org }: OrgCardHardwareSectionProps) {
  const oltPct = org.maxOlts > 0 ? Math.round((org.usedOlts / org.maxOlts) * 100) : 0;

  return (
    <div className="space-y-3 w-full pt-1">
      {/* Hardware Allocation Progress */}
      <div className="space-y-1 rounded-lg bg-background/50 border border-border/40 p-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-foreground flex items-center gap-1">
            <Network className="h-3 w-3 text-muted-foreground" />
            <span>
              {org.usedOlts}/{org.maxOlts} OLTs
            </span>
          </span>
          <span className="text-muted-foreground text-[10px]">
            {org.usedOdps}/{org.maxOdps} ODPs
          </span>
        </div>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", oltPct > 80 ? "bg-amber-500" : "bg-primary")}
            style={{ width: `${Math.min(100, oltPct)}%` }}
          />
        </div>
      </div>

      {/* Custom Domain & PIC Row */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        {org.customDomain ? (
          <div className="flex items-center gap-1 font-mono">
            <Globe className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground">{org.customDomain}</span>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full ml-1",
                org.domainSslActive ? "bg-primary" : "bg-amber-500"
              )}
            />
          </div>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground/60">— Default Domain</span>
        )}

        {/* Direct Contact Buttons */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {org.picPhone && (
            <ActionTooltip label={`Chat PIC (${org.picPhone})`}>
              <a
                href={`https://wa.me/${org.picPhone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
              >
                <Phone className="h-3 w-3" />
              </a>
            </ActionTooltip>
          )}
          {org.picEmail && (
            <ActionTooltip label={`Email PIC (${org.picEmail})`}>
              <a
                href={`mailto:${org.picEmail}`}
                className="p-1 rounded hover:bg-blue-500/10 hover:text-blue-500 transition-colors text-muted-foreground"
              >
                <Mail className="h-3 w-3" />
              </a>
            </ActionTooltip>
          )}
        </div>
      </div>
    </div>
  );
}
