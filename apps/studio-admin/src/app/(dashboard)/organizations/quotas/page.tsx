"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  TablePageSkeleton,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@k2net/ui";
import {
  Network,
  Server,
  Database,
  Cpu,
  Search,
  Sliders,
  RefreshCw,
  ExternalLink,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { TenantQuotaModal } from "@/components/organizations/TenantQuotaModal";
import {
  type EnrichedOrganization,
  type PlanTier,
  type OrganizationStatus,
  normalizePlanTier,
  toBackendPlanName,
} from "@/components/organizations/types";
import { cn } from "@/lib/utils";
import { getTenantUrl } from "@/lib/domain";

export default function OrganizationQuotasPage() {
  const router = useRouter();
  const { organizations: rawOrgs, loading, refresh, updateOrganization } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [selectedOrgForQuota, setSelectedOrgForQuota] = useState<EnrichedOrganization | null>(null);

  // Enriched organizations
  const organizations: EnrichedOrganization[] = useMemo(() => {
    return (rawOrgs || []).map((org: Organization, idx: number) => {
      const planTier = normalizePlanTier(org.subscriptionPlan?.name);
      return {
        id: org.id || `org-${org.slug || idx}`,
        name: org.name || org.slug,
        slug: org.slug,
        description: org.description,
        status: (org.status || "ACTIVE") as OrganizationStatus,
        planTier: planTier,
        createdAt: org.createdAt || "2026-08-20",
        picName: org.adminUsername || "Andiansyah",
        picEmail: org.adminEmail || `admin@${org.slug}.kdua.net`,
        slaTier: planTier === "Enterprise" ? "Platinum (99.9%)" : planTier === "Professional" ? "Gold (99.5%)" : "Standard (99.0%)",
        maxOlts: org.subscriptionPlan?.maxProjects || (planTier === "Enterprise" ? 20 : planTier === "Starter" ? 2 : 5),
        usedOlts: 2,
        maxOdps: org.subscriptionPlan?.maxOdps || (planTier === "Enterprise" ? 10000 : planTier === "Starter" ? 500 : 2500),
        usedOdps: 640,
        maxStorageGb: planTier === "Enterprise" ? 100 : planTier === "Starter" ? 10 : 25,
        usedStorageGb: 3.6,
        domainVerified: true,
        domainSslActive: true,
        featureFlags: {
          gisCore: true,
          oltPoller: planTier !== "Starter",
          whatsappEngine: true,
          aiCopilot: planTier === "Enterprise",
          sandboxMode: false,
        },
        apiRateLimitUsed: 850,
        apiRateLimitMax: planTier === "Enterprise" ? 20000 : planTier === "Starter" ? 2000 : 5000,
        apiLatencyMs: 38,
      };
    });
  }, [rawOrgs]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        refresh();
        toast.success("Hardware quotas refreshed");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refresh]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Filter organizations
  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!org.name.toLowerCase().includes(q) && !org.slug.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (planFilter !== "ALL" && org.planTier !== planFilter) {
        return false;
      }
      return true;
    });
  }, [organizations, searchQuery, planFilter]);

  // Aggregate totals
  const totalMaxOlts = organizations.reduce((acc, o) => acc + o.maxOlts, 0) || 1;
  const totalUsedOlts = organizations.reduce((acc, o) => acc + o.usedOlts, 0);
  const totalMaxOdps = organizations.reduce((acc, o) => acc + o.maxOdps, 0) || 1;
  const totalUsedOdps = organizations.reduce((acc, o) => acc + o.usedOdps, 0);
  const totalMaxStorageGb = organizations.reduce((acc, o) => acc + o.maxStorageGb, 0) || 1;
  const totalStorageGb = Math.round(organizations.reduce((acc, o) => acc + o.usedStorageGb, 0) * 10) / 10;

  if (loading) {
    return (
      <OrganizationPageWrapper>
        <TablePageSkeleton />
      </OrganizationPageWrapper>
    );
  }

  return (
    <OrganizationPageWrapper>
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
        {/* ── 1. Top Header Title Bar ─────────────────────────────── */}
        <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <span>FTTH Spatial Quotas & Hardware Allocation</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Infrastructure limits, OLT hardware slots, and MinIO storage quotas per tenant environment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Refresh Quota Allocations" shortcut="R">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refresh();
                  toast.success("Hardware quotas refreshed");
                }}
                className="h-8 px-3 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* ── 2. Top Cluster Capacity KPI Strip ───────────────────── */}
        <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
                  OLT Slots Quota
                </span>
                <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Network className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                    {totalUsedOlts} <span className="text-xs font-normal text-muted-foreground">/ {totalMaxOlts}</span>
                  </p>
                  <span className="text-xs font-mono text-muted-foreground">
                    {Math.round((totalUsedOlts / totalMaxOlts) * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total registered OLT hardware</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(totalUsedOlts / totalMaxOlts) * 100}%` }}
                />
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
                  ODP Enclosure Quota
                </span>
                <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <Server className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                    {totalUsedOdps.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">/ {totalMaxOdps.toLocaleString()}</span>
                  </p>
                  <span className="text-xs font-mono text-blue-500">
                    {Math.round((totalUsedOdps / totalMaxOdps) * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total mapped splitters</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(totalUsedOdps / totalMaxOdps) * 100}%` }}
                />
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
                  MinIO Storage Pool
                </span>
                <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                  <Database className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                    {totalStorageGb} <span className="text-xs font-normal text-muted-foreground">/ {totalMaxStorageGb} GB</span>
                  </p>
                  <span className="text-xs font-mono text-purple-500">
                    {Math.round((totalStorageGb / totalMaxStorageGb) * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Tenant S3 bucket utilization</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${(totalStorageGb / totalMaxStorageGb) * 100}%` }}
                />
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
                  Kong Rate Limits
                </span>
                <div className="h-6 w-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Cpu className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                    20,000
                  </p>
                  <span className="text-xs font-mono text-muted-foreground">Max RPM</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Enterprise peak gateway burst</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "35%" }} />
              </div>
            </Card>
          </div>
        </div>

        {/* ── 3. Filter Toolbar & Table Card ──────────────────────── */}
        <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
          <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">
            <div className="p-3 px-6 border-b border-border/60 bg-background/50 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter by tenant name or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-card border-border text-foreground"
                  />
                </div>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="h-8 w-[140px] text-xs bg-card border-border text-foreground">
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground text-xs">
                    <SelectItem value="ALL">All Plans</SelectItem>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground font-mono">
                Showing <strong className="text-foreground">{filteredOrgs.length}</strong> of {organizations.length} organizations
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-muted/40 border-b border-border/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6 min-w-[200px]">
                      Organization
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">
                      Plan Tier
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">
                      OLT Slots Quota
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">
                      ODP Points Quota
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
                      MinIO Storage
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">
                      Rate Limit
                    </TableHead>
                    <TableHead className="text-right pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredOrgs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center text-muted-foreground text-xs">
                        No organizations matching your search filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrgs.map((org) => {
                      const oltPct = org.maxOlts > 0 ? Math.round((org.usedOlts / org.maxOlts) * 100) : 0;
                      const odpPct = org.maxOdps > 0 ? Math.round((org.usedOdps / org.maxOdps) * 100) : 0;
                      const storagePct = org.maxStorageGb > 0 ? Math.round((org.usedStorageGb / org.maxStorageGb) * 100) : 0;

                      return (
                        <ContextMenu key={org.id}>
                          <ContextMenuTrigger asChild>
                            <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
                              {/* Organization Name */}
                              <TableCell className="pl-6 py-3.5" onClick={() => router.push(`/organizations/${org.slug}`)}>
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground font-bold font-mono text-xs shrink-0 shadow-2xs">
                                    {org.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-foreground block hover:text-primary transition-colors">
                                      {org.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      {org.slug}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Plan Tier */}
                              <TableCell className="py-3.5">
                                <Badge variant="outline" className="border-border font-mono text-[10px]">
                                  {org.planTier}
                                </Badge>
                              </TableCell>

                              {/* OLT Allocation */}
                              <TableCell className="py-3.5">
                                <div className="space-y-1 w-full max-w-[150px]">
                                  <div className="flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-foreground font-semibold">
                                      {org.usedOlts}/{org.maxOlts} OLTs
                                    </span>
                                    <span className="text-muted-foreground">{oltPct}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={cn("h-full rounded-full transition-all", oltPct > 80 ? "bg-amber-500" : "bg-primary")}
                                      style={{ width: `${Math.min(100, oltPct)}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>

                              {/* ODP Allocation */}
                              <TableCell className="py-3.5">
                                <div className="space-y-1 w-full max-w-[150px]">
                                  <div className="flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-foreground font-semibold">
                                      {org.usedOdps}/{org.maxOdps} ODPs
                                    </span>
                                    <span className="text-muted-foreground">{odpPct}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 rounded-full transition-all"
                                      style={{ width: `${Math.min(100, odpPct)}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>

                              {/* MinIO Storage */}
                              <TableCell className="py-3.5">
                                <div className="space-y-1 w-full max-w-[130px]">
                                  <div className="flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-foreground font-semibold">
                                      {org.usedStorageGb}/{org.maxStorageGb} GB
                                    </span>
                                    <span className="text-muted-foreground">{storagePct}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-purple-500 rounded-full transition-all"
                                      style={{ width: `${Math.min(100, storagePct)}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>

                              {/* Rate Limit */}
                              <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
                                <span className="text-foreground font-semibold">{org.apiRateLimitMax}</span> RPM
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="py-3.5 pr-6 text-right">
                                <ActionTooltip label={`Adjust quotas for ${org.name}`} shortcut="Q">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedOrgForQuota(org)}
                                    className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2.5 font-semibold"
                                  >
                                    <Sliders className="h-3 w-3 text-primary" />
                                    <span>Adjust</span>
                                  </Button>
                                </ActionTooltip>
                              </TableCell>
                            </TableRow>
                          </ContextMenuTrigger>

                          <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
                            <ContextMenuItem
                              onClick={() => setSelectedOrgForQuota(org)}
                              className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
                            >
                              <Sliders className="w-3.5 h-3.5 text-primary" />
                              <span>Adjust Hardware Quotas</span>
                              <ContextMenuShortcut>Q</ContextMenuShortcut>
                            </ContextMenuItem>

                            <ContextMenuItem
                              onClick={() => router.push(`/organizations/${org.slug}`)}
                              className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                            >
                              <Network className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Open Organization Detail</span>
                              <ContextMenuShortcut>↵</ContextMenuShortcut>
                            </ContextMenuItem>

                            <ContextMenuItem
                              onClick={() => window.open(getTenantUrl(org.slug), "_blank")}
                              className="cursor-pointer gap-2 focus:bg-muted"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Login as Tenant Admin</span>
                              <ContextMenuShortcut>Ctrl ↵</ContextMenuShortcut>
                            </ContextMenuItem>

                            <ContextMenuSeparator className="bg-border/40 my-1" />

                            <ContextMenuItem
                              onClick={() =>
                                handleCopy(
                                  `OLTs: ${org.usedOlts}/${org.maxOlts}, ODPs: ${org.usedOdps}/${org.maxOdps}, Storage: ${org.usedStorageGb}/${org.maxStorageGb} GB`,
                                  "Quota summary"
                                )
                              }
                              className="cursor-pointer gap-2 focus:bg-muted"
                            >
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Copy Quota Summary</span>
                            </ContextMenuItem>

                            <ContextMenuItem
                              onClick={() => handleCopy(org.slug, "Tenant Slug")}
                              className="cursor-pointer gap-2 focus:bg-muted"
                            >
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Copy Slug ({org.slug})</span>
                              <ContextMenuShortcut>C</ContextMenuShortcut>
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Quota Modal */}
        <TenantQuotaModal
          organization={selectedOrgForQuota}
          isOpen={!!selectedOrgForQuota}
          onClose={() => setSelectedOrgForQuota(null)}
          onSaveQuotas={async (_orgId, quotas) => {
            if (selectedOrgForQuota && updateOrganization) {
              await updateOrganization({
                slug: selectedOrgForQuota.slug,
                org: {
                  subscriptionPlan: {
                    name: toBackendPlanName(quotas.planTier || selectedOrgForQuota.planTier),
                    maxProjects: quotas.maxOlts,
                    maxOdps: quotas.maxOdps,
                  },
                },
              });
              refresh();
            }
          }}
        />
      </div>
    </OrganizationPageWrapper>
  );
}
