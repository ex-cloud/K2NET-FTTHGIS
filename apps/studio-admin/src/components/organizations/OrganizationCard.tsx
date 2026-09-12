import * as React from "react";
import { useRouter } from "@/lib/navigation-compat";
import { Badge } from "@k2net/ui";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTenantUrl } from "@/lib/domain";
import type { EnrichedOrganization, OrganizationStatus } from "./types";
import { OrganizationContextMenu } from "./OrganizationContextMenu";
import { OrgStatusBadge } from "./card/OrgStatusBadge";
import { OrgCardHardwareSection } from "./card/OrgCardHardwareSection";
import { OrgCardFooter } from "./card/OrgCardFooter";

interface OrganizationCardProps {
  organization: EnrichedOrganization;
  viewMode: "grid" | "list";
  onImpersonate: (org: EnrichedOrganization) => void;
  onOpenDomainModal: (org: EnrichedOrganization) => void;
  onOpenQuotaModal: (org: EnrichedOrganization) => void;
  onOpenFlagsModal: (org: EnrichedOrganization) => void;
  onExtendTrial: (org: EnrichedOrganization) => void;
  onUpdateStatus: (org: EnrichedOrganization, status: OrganizationStatus) => void;
  onDelete: (org: EnrichedOrganization) => void;
}

export function OrganizationCard({
  organization: org,
  viewMode,
  onImpersonate,
  onOpenDomainModal,
  onOpenQuotaModal,
  onOpenFlagsModal,
  onExtendTrial,
  onUpdateStatus,
  onDelete,
}: OrganizationCardProps) {
  const router = useRouter();

  return (
    <OrganizationContextMenu
      organization={org}
      onImpersonate={onImpersonate}
      onOpenDomainModal={onOpenDomainModal}
      onOpenQuotaModal={onOpenQuotaModal}
      onOpenFlagsModal={onOpenFlagsModal}
      onExtendTrial={onExtendTrial}
      onUpdateStatus={onUpdateStatus}
      onDelete={onDelete}
    >
      <div
        className={cn(
          "group relative rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 transition-all duration-200 hover:border-primary/40 hover:bg-card/90 hover:shadow-lg cursor-pointer text-xs flex flex-col justify-between",
          viewMode === "list" ? "flex-row items-center gap-4" : "space-y-4"
        )}
        onClick={() => router.push(`/organizations/${org.slug}`)}
      >
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 w-full">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground font-bold font-mono text-sm shrink-0 shadow-2xs group-hover:border-primary/40 transition-colors">
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                  {org.name}
                </span>
                <Badge variant="outline" className="border-border/60 text-[9px] px-1 py-0 font-mono text-muted-foreground">
                  {org.planTier}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                <span>{org.slug}</span>
                <span>•</span>
                <a
                  href={getTenantUrl(org.slug)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-primary flex items-center gap-0.5 underline text-muted-foreground/80"
                >
                  <span>subdomain</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <OrgStatusBadge status={org.status} trialDaysLeft={org.trialDaysLeft} />
          </div>
        </div>

        <OrgCardHardwareSection organization={org} />
        <OrgCardFooter organization={org} onImpersonate={onImpersonate} />
      </div>
    </OrganizationContextMenu>
  );
}
