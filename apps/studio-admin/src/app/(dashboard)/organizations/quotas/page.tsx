"use client";

import { useState, useMemo } from "react";
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
  PageLayout,
  TablePageSkeleton,
} from "@k2net/ui";
import {
  Network,
  Server,
  Database,
  Cpu,
  Search,
  Sliders,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { TenantQuotaModal } from "@/components/organizations/TenantQuotaModal";
import type { EnrichedOrganization, PlanTier, OrganizationStatus } from "@/components/organizations/types";
import { cn } from "@/lib/utils";

export default function OrganizationQuotasPage() {
  const { organizations: rawOrgs, loading, refresh } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [selectedOrgForQuota, setSelectedOrgForQuota] = useState<EnrichedOrganization | null>(null);

  // Enriched organizations
  const organizations: EnrichedOrganization[] = useMemo(() => {
    return (rawOrgs || []).map((org: Organization, idx: number) => {
      const planName = (org.subscriptionPlan?.name || "Professional") as PlanTier;
      return {
        id: org.id || `org-${org.slug || idx}`,
        name: org.name || org.slug,
        slug: org.slug,
        description: org.description,
        status: (org.status || "ACTIVE") as OrganizationStatus,
        planTier: ["Starter", "Professional", "Enterprise", "Custom"].includes(planName) ? planName : "Professional",
        createdAt: org.createdAt || "2026-08-20",
        picName: org.adminUsername || "Andiansyah",
        picEmail: org.adminEmail || `admin@${org.slug}.kdua.net`,
        slaTier: planName === "Enterprise" ? "Platinum (99.9%)" : "Gold (99.5%)",
        maxOlts: planName === "Enterprise" ? 20 : planName === "Starter" ? 2 : 5,
        usedOlts: Math.max(1, (idx + 1) * 2 % 5),
        maxOdps: planName === "Enterprise" ? 10000 : planName === "Starter" ? 500 : 2500,
        usedOdps: Math.max(40, (idx + 1) * 320 % 2400),
        maxStorageGb: planName === "Enterprise" ? 100 : 10,
        usedStorageGb: Number((((idx + 1) * 1.8) % 8.5).toFixed(1)),
        domainVerified: true,
        domainSslActive: true,
        featureFlags: {
          gisCore: true,
          oltPoller: true,
          whatsappEngine: true,
          aiCopilot: planName === "Enterprise",
          sandboxMode: false,
        },
        apiRateLimitUsed: Math.max(120, (idx + 1) * 850 % 4800),
        apiRateLimitMax: planName === "Enterprise" ? 20000 : 5000,
        apiLatencyMs: 38,
      };
    });
  }, [rawOrgs]);

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
  const totalUsedOlts = organizations.reduce((acc, o) => acc + o.usedOlts, 0);
  const totalMaxOlts = organizations.reduce((acc, o) => acc + o.maxOlts, 0) || 1;
  const totalUsedOdps = organizations.reduce((acc, o) => acc + o.usedOdps, 0);
  const totalMaxOdps = organizations.reduce((acc, o) => acc + o.maxOdps, 0) || 1;
  const totalStorageGb = Number(organizations.reduce((acc, o) => acc + o.usedStorageGb, 0).toFixed(1));
  const totalMaxStorageGb = organizations.reduce((acc, o) => acc + o.maxStorageGb, 0) || 1;

  if (loading) {
    return (
      <OrganizationPageWrapper>
        <TablePageSkeleton />
      </OrganizationPageWrapper>
    );
  }

  return (
    <OrganizationPageWrapper>
      <PageLayout className="p-0 flex flex-col h-full overflow-hidden bg-background">
        {/* ── 1. Top Header Title Bar ─────────────────────────────── */}
        <div className="py-4 px-6 border-b border-border/60 shrink-0 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Network className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>FTTH Spatial Capacity & Quota Allocation</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Monitor and allocate OLT hardware nodes, PostGIS ODP enclosures, and MinIO storage across tenants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refresh();
                toast.success("Quota metrics refreshed");
              }}
              className="text-xs border-border bg-card hover:bg-accent text-muted-foreground gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── 2. Top Capacity KPI Cards ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-4 border-b border-border/60 bg-muted/10 shrink-0">
          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                Cluster OLT Slots
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  {totalUsedOlts} / {totalMaxOlts}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  ({Math.round((totalUsedOlts / totalMaxOlts) * 100)}%)
                </span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Network className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                PostGIS Mapped ODPs
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  {totalUsedOdps} / {totalMaxOdps}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  ({Math.round((totalUsedOdps / totalMaxOdps) * 100)}%)
                </span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Server className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                MinIO GIS Storage
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  {totalStorageGb} / {totalMaxStorageGb} GB
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  ({Math.round((totalStorageGb / totalMaxStorageGb) * 100)}%)
                </span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Database className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                Kong RPM Load
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  1,240 RPM
                </span>
                <span className="text-[11px] text-primary font-mono font-semibold">Healthy</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* ── 3. Filter Toolbar ───────────────────────────────────── */}
        <div className="p-4 px-6 border-b border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
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

          <span className="text-xs font-mono text-muted-foreground">
            Showing {filteredOrgs.length} of {organizations.length} organizations
          </span>
        </div>

        {/* ── 4. Quotas Table ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6 min-w-[200px]">
                    Organization
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">
                    Plan Tier
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[170px]">
                    OLT Allocation
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[170px]">
                    ODP Allocation
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[150px]">
                    MinIO Storage
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
                    API Rate Limit
                  </TableHead>
                  <TableHead className="text-right pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[130px]">
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
                      <TableRow key={org.id} className="border-b border-border/50 text-xs hover:bg-muted/30">
                        {/* Organization Name */}
                        <TableCell className="pl-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground font-bold font-mono text-xs shrink-0 shadow-2xs">
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-semibold text-foreground block">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrgForQuota(org)}
                            className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2.5 font-semibold"
                          >
                            <Sliders className="h-3 w-3 text-primary" />
                            <span>Adjust</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Quota Modal */}
        <TenantQuotaModal
          organization={selectedOrgForQuota}
          isOpen={!!selectedOrgForQuota}
          onClose={() => setSelectedOrgForQuota(null)}
          onSaveQuotas={async () => {
            refresh();
          }}
        />
      </PageLayout>
    </OrganizationPageWrapper>
  );
}
