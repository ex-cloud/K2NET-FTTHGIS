"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Checkbox,
  Badge,
  ActionTooltip,
} from "@k2net/ui";
import {
  ExternalLink,
  Globe,
  Radio,
  MessageSquare,
  Sparkles,
  Map,
  Clock,
  AlertTriangle,
  PauseCircle,
  RefreshCw,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization, OrganizationStatus } from "./types";
import { OrganizationContextMenu } from "./OrganizationContextMenu";
import { getTenantUrl } from "@/lib/domain";

interface OrganizationTableProps {
  organizations: EnrichedOrganization[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onImpersonate: (org: EnrichedOrganization) => void;
  onOpenDomainModal: (org: EnrichedOrganization) => void;
  onOpenQuotaModal: (org: EnrichedOrganization) => void;
  onOpenFlagsModal: (org: EnrichedOrganization) => void;
  onExtendTrial: (org: EnrichedOrganization) => void;
  onUpdateStatus: (org: EnrichedOrganization, status: OrganizationStatus) => void;
  onDelete: (org: EnrichedOrganization) => void;
}

export function OrganizationTable({
  organizations,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onImpersonate,
  onOpenDomainModal,
  onOpenQuotaModal,
  onOpenFlagsModal,
  onExtendTrial,
  onUpdateStatus,
  onDelete,
}: OrganizationTableProps) {
  const router = useRouter();
  const allSelected = organizations.length > 0 && selectedIds.length === organizations.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < organizations.length;

  const getStatusBadge = (org: EnrichedOrganization) => {
    switch (org.status) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>Active</span>
          </Badge>
        );
      case "TRIAL":
        return (
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 font-mono text-[10px] gap-1 px-2 py-0.5 shadow-2xs">
            <Clock className="h-2.5 w-2.5" />
            <span>Trial ({org.trialDaysLeft || 14}d left)</span>
          </Badge>
        );
      case "PROVISIONING":
        return (
          <ActionTooltip label="Step 3/4: Configuring Kong Ingress Route & Storage">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px] gap-1 px-2 py-0.5 shadow-2xs cursor-help">
              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
              <span>Provisioning...</span>
            </Badge>
          </ActionTooltip>
        );
      case "OVERDUE":
        return (
          <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-500 font-mono text-[10px] gap-1 px-2 py-0.5 shadow-2xs">
            <AlertTriangle className="h-2.5 w-2.5" />
            <span>Overdue (3d grace)</span>
          </Badge>
        );
      case "SUSPENDED":
      case "TRIAL_EXPIRED":
        return (
          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive font-mono text-[10px] gap-1 px-2 py-0.5 shadow-2xs">
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
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/40 border-b border-border/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px] pl-6">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[220px]">
              Organization
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[140px]">
              Status
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
              Hardware Quota
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
              Domain & SSL
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
              Add-on Flags
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px] pr-6">
              Technical PIC
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {organizations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center text-muted-foreground text-xs">
                No organizations found matching the selected filters.
              </TableCell>
            </TableRow>
          ) : (
            organizations.map((org) => {
              const isSelected = selectedIds.includes(org.id);
              const oltPct = org.maxOlts > 0 ? Math.round((org.usedOlts / org.maxOlts) * 100) : 0;

              return (
                <OrganizationContextMenu
                  key={org.id}
                  organization={org}
                  onImpersonate={onImpersonate}
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
                      isSelected && "bg-primary/5 hover:bg-primary/10"
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
                      {getStatusBadge(org)}
                    </TableCell>

                    <TableCell className="py-3.5">
                      <div className="space-y-1 w-full max-w-[160px]">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-foreground font-medium">
                            {org.usedOlts}/{org.maxOlts} OLTs
                          </span>
                          <span className="text-muted-foreground">
                            {org.usedOdps} ODPs
                          </span>
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
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              org.domainSslActive ? "bg-primary" : "bg-amber-500"
                            )} />
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
                    </TableCell>

                    <TableCell className="py-3.5 pr-6" onClick={(e) => e.stopPropagation()}>
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
                              <a
                                href={`mailto:${org.picEmail}`}
                                className="hover:text-blue-500 transition-colors"
                              >
                                <Mail className="h-3 w-3" />
                              </a>
                            </ActionTooltip>
                          )}
                          <span className="text-[9px] font-mono text-muted-foreground/60">
                            {org.slaTier.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </OrganizationContextMenu>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
