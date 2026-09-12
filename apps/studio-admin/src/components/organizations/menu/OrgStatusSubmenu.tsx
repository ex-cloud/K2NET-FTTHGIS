import * as React from "react";
import {
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuItem,
} from "@k2net/ui";
import { ShieldCheck, CheckCircle2, PauseCircle, Clock } from "lucide-react";
import type { EnrichedOrganization, OrganizationStatus } from "../types";

interface OrgStatusSubmenuProps {
  organization: EnrichedOrganization;
  onUpdateStatus?: (org: EnrichedOrganization, status: OrganizationStatus) => void;
}

export function OrgStatusSubmenu({ organization, onUpdateStatus }: OrgStatusSubmenuProps) {
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger className="cursor-pointer gap-2 focus:bg-muted">
        <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Lifecycle Status</span>
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border/80 shadow-xl rounded-xl py-1">
        <ContextMenuItem
          onClick={() => onUpdateStatus?.(organization, "ACTIVE")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span>Set Active</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onUpdateStatus?.(organization, "SUSPENDED")}
          className="cursor-pointer gap-2 focus:bg-muted text-destructive"
        >
          <PauseCircle className="w-3.5 h-3.5" />
          <span>Suspend Tenant</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onUpdateStatus?.(organization, "TRIAL")}
          className="cursor-pointer gap-2 focus:bg-muted text-blue-500"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Set as Trial</span>
        </ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  );
}
