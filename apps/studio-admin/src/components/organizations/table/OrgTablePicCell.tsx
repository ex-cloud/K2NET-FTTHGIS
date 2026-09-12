import * as React from "react";
import { ActionTooltip } from "@k2net/ui";
import { Phone, Mail } from "lucide-react";
import type { EnrichedOrganization } from "../types";

interface OrgTablePicCellProps {
  organization: EnrichedOrganization;
}

export function OrgTablePicCell({ organization: org }: OrgTablePicCellProps) {
  return (
    <div className="space-y-0.5">
      <span className="font-medium text-foreground block text-[11px]">
        {org.picName || "Admin Support"}
      </span>
      <div className="flex items-center gap-2 text-muted-foreground">
        {org.picPhone && (
          <ActionTooltip label={`Chat WhatsApp (${org.picPhone})`}>
            <a
              href={`https://wa.me/${org.picPhone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3" />
            </a>
          </ActionTooltip>
        )}
        {org.picEmail && (
          <ActionTooltip label={`Email PIC (${org.picEmail})`}>
            <a href={`mailto:${org.picEmail}`} className="hover:text-blue-500 transition-colors">
              <Mail className="h-3 w-3" />
            </a>
          </ActionTooltip>
        )}
        <span className="text-[9px] font-mono text-muted-foreground/60">
          {org.slaTier.split(" ")[0]}
        </span>
      </div>
    </div>
  );
}
