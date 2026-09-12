import * as React from "react";
import { Badge } from "@k2net/ui";
import { Clock, RefreshCw, AlertTriangle, PauseCircle } from "lucide-react";
import type { OrganizationStatus } from "../types";

interface OrgStatusBadgeProps {
  status: OrganizationStatus | string;
  trialDaysLeft?: number;
}

export function OrgStatusBadge({ status, trialDaysLeft }: OrgStatusBadgeProps) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>Active</span>
        </Badge>
      );
    case "TRIAL":
      return (
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 font-mono text-[10px] gap-1 px-2 py-0.5">
          <Clock className="h-2.5 w-2.5" />
          <span>Trial ({trialDaysLeft || 14}d)</span>
        </Badge>
      );
    case "PROVISIONING":
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px] gap-1 px-2 py-0.5">
          <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          <span>Provisioning</span>
        </Badge>
      );
    case "OVERDUE":
      return (
        <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-500 font-mono text-[10px] gap-1 px-2 py-0.5">
          <AlertTriangle className="h-2.5 w-2.5" />
          <span>Overdue</span>
        </Badge>
      );
    case "SUSPENDED":
    case "TRIAL_EXPIRED":
      return (
        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive font-mono text-[10px] gap-1 px-2 py-0.5">
          <PauseCircle className="h-2.5 w-2.5" />
          <span>Suspended</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[10px]">
          {status}
        </Badge>
      );
  }
}
