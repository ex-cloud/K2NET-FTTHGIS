"use client";

import { useState, useMemo } from "react";
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
  Switch,
  PageLayout,
  TablePageSkeleton,
} from "@k2net/ui";
import {
  Sliders,
  Map,
  Radio,
  MessageSquare,
  Sparkles,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import type { EnrichedOrganization, PlanTier, OrganizationFeatureFlags, OrganizationStatus } from "@/components/organizations/types";

export default function OrganizationFeaturesPage() {
  const router = useRouter();
  const { organizations: rawOrgs, loading, refresh } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");

  // Local feature flags state per organization id
  const [flagsState, setFlagsState] = useState<Record<string, OrganizationFeatureFlags>>({});

  // Enriched organizations
  const organizations: EnrichedOrganization[] = useMemo(() => {
    return (rawOrgs || []).map((org: Organization, idx: number) => {
      const planName = (org.subscriptionPlan?.name || "Professional") as PlanTier;
      const initialFlags: OrganizationFeatureFlags = {
        gisCore: true,
        oltPoller: planName !== "Starter",
        whatsappEngine: true,
        aiCopilot: planName === "Enterprise",
        sandboxMode: false,
      };

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
        maxOlts: planName === "Enterprise" ? 20 : 5,
        usedOlts: 2,
        maxOdps: planName === "Enterprise" ? 10000 : 2500,
        usedOdps: 640,
        maxStorageGb: planName === "Enterprise" ? 100 : 10,
        usedStorageGb: 3.6,
        domainVerified: true,
        domainSslActive: true,
        featureFlags: flagsState[org.id || `org-${org.slug || idx}`] || initialFlags,
        apiRateLimitUsed: 850,
        apiRateLimitMax: 5000,
        apiLatencyMs: 38,
      };
    });
  }, [rawOrgs, flagsState]);

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

  // Toggle single flag
  const handleToggleFlag = (orgId: string, orgName: string, flagKey: keyof OrganizationFeatureFlags) => {
    setFlagsState((prev) => {
      const currentOrg = organizations.find((o) => o.id === orgId);
      const currentFlags = prev[orgId] || currentOrg?.featureFlags || {
        gisCore: true,
        oltPoller: false,
        whatsappEngine: false,
        aiCopilot: false,
        sandboxMode: false,
      };
      const updated = { ...currentFlags, [flagKey]: !currentFlags[flagKey] };
      toast.success(`${flagKey} ${updated[flagKey] ? "enabled" : "disabled"} for ${orgName}`);
      return { ...prev, [orgId]: updated };
    });
  };

  // Bulk enable AI copilot for Enterprise
  const handleBulkEnableEnterpriseAI = () => {
    setFlagsState((prev) => {
      const updated = { ...prev };
      organizations.forEach((org) => {
        if (org.planTier === "Enterprise") {
          updated[org.id] = { ...(prev[org.id] || org.featureFlags), aiCopilot: true };
        }
      });
      return updated;
    });
    toast.success("AI Fiber Copilot enabled for all Enterprise tenants");
  };

  // Adoption statistics
  const totalOrgs = organizations.length || 1;
  const stats = useMemo(() => {
    return {
      gisCore: organizations.filter((o) => o.featureFlags.gisCore).length,
      oltPoller: organizations.filter((o) => o.featureFlags.oltPoller).length,
      whatsapp: organizations.filter((o) => o.featureFlags.whatsappEngine).length,
      aiCopilot: organizations.filter((o) => o.featureFlags.aiCopilot).length,
    };
  }, [organizations]);

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
                <Sliders className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Feature Flags & Module Entitlements Matrix</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Centralized B2B module entitlement control across all tenant organizations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkEnableEnterpriseAI}
              className="text-xs font-semibold border-border bg-card hover:bg-accent text-foreground gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              <span>Enable AI on Enterprise</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refresh();
                toast.success("Entitlements refreshed from backend");
              }}
              className="text-xs border-border bg-card hover:bg-accent text-muted-foreground gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── 2. Top Module Adoption KPI Bar ──────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-4 border-b border-border/60 bg-muted/10 shrink-0">
          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                GIS Spatial Core
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  {Math.round((stats.gisCore / totalOrgs) * 100)}%
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">({stats.gisCore}/{totalOrgs})</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Map className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                OLT Telemetry Poller
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  {Math.round((stats.oltPoller / totalOrgs) * 100)}%
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">({stats.oltPoller}/{totalOrgs})</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Radio className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                WhatsApp Engine
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  {Math.round((stats.whatsapp / totalOrgs) * 100)}%
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">({stats.whatsapp}/{totalOrgs})</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                AI Fiber Copilot
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  {Math.round((stats.aiCopilot / totalOrgs) * 100)}%
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">({stats.aiCopilot}/{totalOrgs})</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Sparkles className="h-4 w-4" />
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

        {/* ── 4. Entitlements Matrix Table ────────────────────────── */}
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
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center w-[130px]">
                    GIS Core
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center w-[140px]">
                    OLT Poller
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center w-[150px]">
                    WhatsApp Engine
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center w-[140px]">
                    AI Copilot
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center w-[130px]">
                    Sandbox Mode
                  </TableHead>
                  <TableHead className="text-right pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">
                    Detail
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-muted-foreground text-xs">
                      No organizations matching your search filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrgs.map((org) => (
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

                      {/* GIS Core Toggle */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={org.featureFlags.gisCore}
                            onCheckedChange={() => handleToggleFlag(org.id, org.name, "gisCore")}
                          />
                        </div>
                      </TableCell>

                      {/* OLT Poller Toggle */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={org.featureFlags.oltPoller}
                            onCheckedChange={() => handleToggleFlag(org.id, org.name, "oltPoller")}
                          />
                        </div>
                      </TableCell>

                      {/* WhatsApp Engine Toggle */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={org.featureFlags.whatsappEngine}
                            onCheckedChange={() => handleToggleFlag(org.id, org.name, "whatsappEngine")}
                          />
                        </div>
                      </TableCell>

                      {/* AI Copilot Toggle */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={org.featureFlags.aiCopilot}
                            onCheckedChange={() => handleToggleFlag(org.id, org.name, "aiCopilot")}
                          />
                        </div>
                      </TableCell>

                      {/* Sandbox Toggle */}
                      <TableCell className="py-3.5 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={org.featureFlags.sandboxMode}
                            onCheckedChange={() => handleToggleFlag(org.id, org.name, "sandboxMode")}
                          />
                        </div>
                      </TableCell>

                      {/* Detail Link */}
                      <TableCell className="py-3.5 pr-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/organizations/${org.slug}`)}
                          className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 px-2"
                        >
                          <span>Manage</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </PageLayout>
    </OrganizationPageWrapper>
  );
}
