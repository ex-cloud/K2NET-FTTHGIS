"use client";

import { useRouter } from "next/navigation";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import {
  ExternalLink,
  Globe,
  Radio,
  Clock,
  RefreshCw,
  Phone,
  Mail,
  Map,
  MessageSquare,
  Sparkles,
  Network,
  AlertTriangle,
  PauseCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTenantUrl } from "@/lib/domain";
import type { EnrichedOrganization, OrganizationStatus } from "./types";
import { OrganizationContextMenu } from "./OrganizationContextMenu";

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
  const oltPct = org.maxOlts > 0 ? Math.round((org.usedOlts / org.maxOlts) * 100) : 0;

  const getStatusBadge = () => {
    switch (org.status) {
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
            <span>Trial ({org.trialDaysLeft || 14}d)</span>
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
            {org.status}
          </Badge>
        );
    }
  };

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

          <div className="shrink-0">{getStatusBadge()}</div>
        </div>

        {/* Middle Hardware & Domain Section */}
        <div className="space-y-3 w-full pt-1">
          {/* Hardware Allocation Progress */}
          <div className="space-y-1 rounded-lg bg-background/50 border border-border/40 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-foreground flex items-center gap-1">
                <Network className="h-3 w-3 text-muted-foreground" />
                <span>{org.usedOlts}/{org.maxOlts} OLTs</span>
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
                <span className={cn("h-1.5 w-1.5 rounded-full ml-1", org.domainSslActive ? "bg-primary" : "bg-amber-500")} />
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

        {/* Footer Add-on Icons & Impersonate Action */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 text-muted-foreground">
            <ActionTooltip label="GIS Spatial Core">
              <div className={cn("p-1 rounded", org.featureFlags.gisCore ? "text-primary" : "opacity-30")}>
                <Map className="h-3 w-3" />
              </div>
            </ActionTooltip>
            <ActionTooltip label="OLT Snmp Poller">
              <div className={cn("p-1 rounded", org.featureFlags.oltPoller ? "text-primary bg-primary/10" : "opacity-30")}>
                <Radio className="h-3 w-3" />
              </div>
            </ActionTooltip>
            <ActionTooltip label="WhatsApp Billing Engine">
              <div className={cn("p-1 rounded", org.featureFlags.whatsappEngine ? "text-blue-500" : "opacity-30")}>
                <MessageSquare className="h-3 w-3" />
              </div>
            </ActionTooltip>
            <ActionTooltip label="AI Fiber Routing Copilot">
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
            <span>Open Portal</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </OrganizationContextMenu>
  );
}
