import * as React from "react";
import { useRouter } from "@/lib/navigation-compat";
import { TableRow, TableCell, Checkbox, Badge, ActionTooltip } from "@k2net/ui";
import { ExternalLink, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTenantUrl } from "@/lib/domain";
import type { EnrichedOrganization, OrganizationStatus } from "../types";
import { OrganizationContextMenu } from "../OrganizationContextMenu";
import { OrgStatusBadge } from "../card/OrgStatusBadge";
import { OrgTableFlagsCell } from "./OrgTableFlagsCell";
import { OrgTablePicCell } from "./OrgTablePicCell";

interface OrganizationTableRowProps {
  organization: EnrichedOrganization;
  isSelected: boolean;
  isImpersonatingThisOrg: boolean;
  activeImpersonationRemainingSeconds?: number;
  onToggleSelect: (id: string) => void;
  onImpersonate: (org: EnrichedOrganization) => void;
  onStopImpersonation?: (org: EnrichedOrganization) => void;
  onReopenPortal?: (org: EnrichedOrganization) => void;
  onOpenDomainModal: (org: EnrichedOrganization) => void;
  onOpenQuotaModal: (org: EnrichedOrganization) => void;
  onOpenFlagsModal: (org: EnrichedOrganization) => void;
  onExtendTrial: (org: EnrichedOrganization) => void;
  onUpdateStatus: (org: EnrichedOrganization, status: OrganizationStatus) => void;
  onDelete: (org: EnrichedOrganization) => void;
}

function formatRemaining(totalSeconds?: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

export function OrganizationTableRow({
  organization: org,
  isSelected,
  isImpersonatingThisOrg,
  activeImpersonationRemainingSeconds,
  onToggleSelect,
  onImpersonate,
  onStopImpersonation,
  onReopenPortal,
  onOpenDomainModal,
  onOpenQuotaModal,
  onOpenFlagsModal,
  onExtendTrial,
  onUpdateStatus,
  onDelete,
}: OrganizationTableRowProps) {
  const router = useRouter();
  const oltPct = org.maxOlts > 0 ? Math.round((org.usedOlts / org.maxOlts) * 100) : 0;

  return (
    <OrganizationContextMenu
      organization={org}
      isActiveImpersonated={isImpersonatingThisOrg}
      onViewDetail={(o) => router.push(`/organizations/${o.slug}`)}
      onImpersonate={onImpersonate}
      onStopImpersonation={onStopImpersonation}
      onReopenPortal={onReopenPortal}
      onOpenDomainModal={onOpenDomainModal}
      onOpenQuotaModal={onOpenQuotaModal}
      onOpenFlagsModal={onOpenFlagsModal}
      onExtendTrial={onExtendTrial}
      onUpdateStatus={onUpdateStatus}
      onDelete={onDelete}
    >
      <TableRow
        onClick={() => router.push(`/organizations/${org.slug}`)}
        className={cn(
          "group border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer text-xs",
          isSelected && "bg-primary/5 hover:bg-primary/10",
          isImpersonatingThisOrg && "border-amber-500/40 bg-amber-500/[0.04] hover:bg-amber-500/[0.08]"
        )}
      >
        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(org.id)}
            aria-label={`Select ${org.name}`}
          />
        </TableCell>

        <TableCell className="py-3.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground font-bold font-mono text-xs shrink-0 shadow-2xs group-hover:border-primary/40 transition-colors">
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {org.name}
                </span>
                <Badge variant="outline" className="border-border/60 text-[9px] px-1 py-0 font-mono text-muted-foreground">
                  {org.planTier}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                <span>{org.slug}</span>
                <span>•</span>
                <a
                  href={getTenantUrl(org.slug)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-primary flex items-center gap-0.5 underline text-muted-foreground/80"
                >
                  <span>portal</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell className="py-3.5">
          <OrgStatusBadge status={org.status} trialDaysLeft={org.trialDaysLeft} />
        </TableCell>

        <TableCell className="py-3.5">
          {isImpersonatingThisOrg ? (
            <ActionTooltip label="Sesi Impersonasi Super Admin sedang aktif. Klik untuk membuka Support Access Center.">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/organizations/impersonation");
                }}
                className="cursor-pointer"
              >
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/15 text-amber-500 font-mono text-[10px] gap-1.5 px-2 py-0.5 shadow-2xs font-semibold hover:bg-amber-500/25 transition-colors">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>ACTIVE ({formatRemaining(activeImpersonationRemainingSeconds)})</span>
                </Badge>
              </button>
            </ActionTooltip>
          ) : (
            <span className="text-[11px] font-mono text-muted-foreground/50">— Inactive</span>
          )}
        </TableCell>

        <TableCell className="py-3.5">
          <div className="space-y-1 w-full max-w-[160px]">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-foreground font-medium">
                {org.usedOlts}/{org.maxOlts} OLTs
              </span>
              <span className="text-muted-foreground">{org.usedOdps} ODPs</span>
            </div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  oltPct > 80 ? "bg-amber-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, oltPct)}%` }}
              />
            </div>
          </div>
        </TableCell>

        <TableCell className="py-3.5">
          {org.customDomain ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span>{org.customDomain}</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    org.domainSslActive ? "bg-primary" : "bg-amber-500"
                  )}
                />
                <span className="text-[10px] text-muted-foreground font-mono">
                  {org.domainSslActive ? "SSL Verified" : "DNS Pending"}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground/60 font-mono text-[11px]">— Default Subdomain</span>
          )}
        </TableCell>

        <TableCell className="py-3.5">
          <OrgTableFlagsCell organization={org} />
        </TableCell>

        <TableCell className="py-3.5 pr-6" onClick={(e) => e.stopPropagation()}>
          <OrgTablePicCell organization={org} />
        </TableCell>
      </TableRow>
    </OrganizationContextMenu>
  );
}
