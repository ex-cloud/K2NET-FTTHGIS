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
  Switch,
  Card,
  TablePageSkeleton,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
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
  Copy,
  CheckCircle2,
  FlaskConical,
  Network,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import type { EnrichedOrganization, PlanTier, OrganizationFeatureFlags, OrganizationStatus } from "@/components/organizations/types";
import { getTenantUrl } from "@/lib/domain";

export default function OrganizationFeaturesPage() {
  const router = useRouter();
  const { organizations: rawOrgs, loading, refresh } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [flagsState, setFlagsState] = useState<Record<string, OrganizationFeatureFlags>>({});

  // Transform raw organizations to enriched type
  const organizations: EnrichedOrganization[] = useMemo(() => {
    return (rawOrgs || []).map((o: Organization) => {
      const planName = (o.subscriptionPlan?.name || "Professional") as PlanTier;
      const status = (o.status || "ACTIVE") as OrganizationStatus;

      // Default feature flags based on plan tier
      const defaultFlags: OrganizationFeatureFlags = {
        gisCore: true,
        oltPoller: planName !== "Starter",
        whatsappEngine: true,
        aiCopilot: planName === "Enterprise",
        sandboxMode: false,
      };

      const customFlags = flagsState[o.id || o.slug] || defaultFlags;

      return {
        id: o.id || `org-${o.slug}`,
        name: o.name || o.slug,
        slug: o.slug,
        description: o.description,
        address: o.address,
        website: o.website,
        logoUrl: o.logoUrl,
        status: status,
        planTier: ["Starter", "Professional", "Enterprise", "Custom"].includes(planName) ? planName : "Professional",
        createdAt: o.createdAt || "2026-08-20",

        picName: o.adminUsername ? `${o.adminUsername}` : "Andiansyah",
        picEmail: o.adminEmail || `admin@${o.slug}.kdua.net`,
        picPhone: "+62 812-8899-0011",
        slaTier: planName === "Enterprise" ? "Platinum (99.9%)" : planName === "Professional" ? "Gold (99.5%)" : "Standard (99.0%)",

        maxOlts: o.subscriptionPlan?.maxProjects || (planName === "Enterprise" ? 20 : planName === "Starter" ? 2 : 5),
        usedOlts: 2,
        maxOdps: o.subscriptionPlan?.maxOdps || (planName === "Enterprise" ? 10000 : planName === "Starter" ? 500 : 2500),
        usedOdps: 640,
        maxStorageGb: planName === "Enterprise" ? 100 : 10,
        usedStorageGb: 3.6,

        customDomain: o.website?.includes(".") && !o.website.includes("kdua.net") ? o.website.replace(/^https?:\/\//, "") : undefined,
        domainVerified: true,
        domainSslActive: true,

        featureFlags: customFlags,

        apiRateLimitUsed: 850,
        apiRateLimitMax: planName === "Enterprise" ? 20000 : 5000,
        apiLatencyMs: 38,
      };
    });
  }, [rawOrgs, flagsState]);

  // Filtered organizations
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        refresh();
        toast.success("Entitlements refreshed");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refresh]);

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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
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
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
        {/* ── 1. Top Header Title Bar ─────────────────────────────── */}
        <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" />
              <span>Feature Flags & Module Entitlements Matrix</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Centralized B2B module entitlement control across all tenant organizations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Enable AI Fiber Copilot for all Enterprise organizations" shortcut="A">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkEnableEnterpriseAI}
                className="text-xs font-semibold border-border bg-card hover:bg-accent text-foreground gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span>Enable AI on Enterprise</span>
              </Button>
            </ActionTooltip>

            <ActionTooltip label="Refresh Entitlements" shortcut="R">
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
            </ActionTooltip>
          </div>
        </div>

        {/* ── 2. Top Module Adoption KPI Bar ──────────────────────── */}
        <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                  GIS Spatial Core
                </span>
                <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Map className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {Math.round((stats.gisCore / totalOrgs) * 100)}%
                  </p>
                  <span className="text-xs font-mono text-muted-foreground">
                    {stats.gisCore}/{totalOrgs} Tenants
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Core map engine active</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(stats.gisCore / totalOrgs) * 100}%` }}
                />
              </div>
            </Card>

            <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                  OLT Telemetry Poller
                </span>
                <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Radio className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {Math.round((stats.oltPoller / totalOrgs) * 100)}%
                  </p>
                  <span className="text-xs font-mono text-muted-foreground">
                    {stats.oltPoller}/{totalOrgs} Tenants
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">SNMP & SSH telemetry active</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(stats.oltPoller / totalOrgs) * 100}%` }}
                />
              </div>
            </Card>

            <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                  WhatsApp Engine
                </span>
                <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {Math.round((stats.whatsapp / totalOrgs) * 100)}%
                  </p>
                  <span className="text-xs font-mono text-blue-500">
                    {stats.whatsapp}/{totalOrgs} Tenants
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Automated billing notices</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.whatsapp / totalOrgs) * 100}%` }}
                />
              </div>
            </Card>

            <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                  AI Fiber Copilot
                </span>
                <div className="h-6 w-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {Math.round((stats.aiCopilot / totalOrgs) * 100)}%
                  </p>
                  <span className="text-xs font-mono text-purple-500">
                    {stats.aiCopilot}/{totalOrgs} Tenants
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Automated cable routing AI</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.aiCopilot / totalOrgs) * 100}%` }}
                />
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

                            {/* GIS Core Toggle */}
                            <TableCell className="py-3.5 text-center">
                              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionTooltip label={`Toggle GIS Core for ${org.name}`}>
                                  <Switch
                                    checked={org.featureFlags.gisCore}
                                    onCheckedChange={() => handleToggleFlag(org.id, org.name, "gisCore")}
                                  />
                                </ActionTooltip>
                              </div>
                            </TableCell>

                            {/* OLT Poller Toggle */}
                            <TableCell className="py-3.5 text-center">
                              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionTooltip label={`Toggle OLT Poller for ${org.name}`}>
                                  <Switch
                                    checked={org.featureFlags.oltPoller}
                                    onCheckedChange={() => handleToggleFlag(org.id, org.name, "oltPoller")}
                                  />
                                </ActionTooltip>
                              </div>
                            </TableCell>

                            {/* WhatsApp Engine Toggle */}
                            <TableCell className="py-3.5 text-center">
                              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionTooltip label={`Toggle WhatsApp Engine for ${org.name}`}>
                                  <Switch
                                    checked={org.featureFlags.whatsappEngine}
                                    onCheckedChange={() => handleToggleFlag(org.id, org.name, "whatsappEngine")}
                                  />
                                </ActionTooltip>
                              </div>
                            </TableCell>

                            {/* AI Copilot Toggle */}
                            <TableCell className="py-3.5 text-center">
                              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionTooltip label={`Toggle AI Copilot for ${org.name}`}>
                                  <Switch
                                    checked={org.featureFlags.aiCopilot}
                                    onCheckedChange={() => handleToggleFlag(org.id, org.name, "aiCopilot")}
                                  />
                                </ActionTooltip>
                              </div>
                            </TableCell>

                            {/* Sandbox Toggle */}
                            <TableCell className="py-3.5 text-center">
                              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionTooltip label={`Toggle Sandbox Mode for ${org.name}`}>
                                  <Switch
                                    checked={org.featureFlags.sandboxMode}
                                    onCheckedChange={() => handleToggleFlag(org.id, org.name, "sandboxMode")}
                                  />
                                </ActionTooltip>
                              </div>
                            </TableCell>

                            {/* Detail Link */}
                            <TableCell className="py-3.5 pr-6 text-right">
                              <ActionTooltip label={`Manage ${org.name} details`} shortcut="Enter">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/organizations/${org.slug}`)}
                                  className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 px-2"
                                >
                                  <span>Manage</span>
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </ActionTooltip>
                            </TableCell>
                          </TableRow>
                        </ContextMenuTrigger>

                        <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
                          <ContextMenuItem
                            onClick={() => router.push(`/organizations/${org.slug}`)}
                            className="cursor-pointer font-semibold text-foreground focus:bg-accent gap-2"
                          >
                            <Network className="w-3.5 h-3.5 text-primary" />
                            <span>Open Organization Detail</span>
                            <ContextMenuShortcut>↵</ContextMenuShortcut>
                          </ContextMenuItem>

                          <ContextMenuItem
                            onClick={() => window.open(getTenantUrl(org.slug), "_blank")}
                            className="cursor-pointer font-medium text-primary focus:bg-primary/10 focus:text-primary gap-2"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Login as Tenant Admin</span>
                            <ContextMenuShortcut>Ctrl ↵</ContextMenuShortcut>
                          </ContextMenuItem>

                          <ContextMenuSeparator className="bg-border/40 my-1" />

                          <ContextMenuSub>
                            <ContextMenuSubTrigger className="cursor-pointer gap-2 focus:bg-muted">
                              <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Toggle Entitlements</span>
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-56 bg-popover/95 backdrop-blur-xl border-border/80 shadow-xl rounded-xl py-1">
                              <ContextMenuItem
                                onClick={() => handleToggleFlag(org.id, org.name, "gisCore")}
                                className="cursor-pointer gap-2 justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Map className="w-3.5 h-3.5 text-primary" />
                                  <span>GIS Spatial Core</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono">
                                  {org.featureFlags.gisCore ? "ON" : "OFF"}
                                </Badge>
                              </ContextMenuItem>

                              <ContextMenuItem
                                onClick={() => handleToggleFlag(org.id, org.name, "oltPoller")}
                                className="cursor-pointer gap-2 justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Radio className="w-3.5 h-3.5 text-primary" />
                                  <span>OLT Telemetry</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono">
                                  {org.featureFlags.oltPoller ? "ON" : "OFF"}
                                </Badge>
                              </ContextMenuItem>

                              <ContextMenuItem
                                onClick={() => handleToggleFlag(org.id, org.name, "whatsappEngine")}
                                className="cursor-pointer gap-2 justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                                  <span>WhatsApp Engine</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono">
                                  {org.featureFlags.whatsappEngine ? "ON" : "OFF"}
                                </Badge>
                              </ContextMenuItem>

                              <ContextMenuItem
                                onClick={() => handleToggleFlag(org.id, org.name, "aiCopilot")}
                                className="cursor-pointer gap-2 justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                  <span>AI Fiber Copilot</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono">
                                  {org.featureFlags.aiCopilot ? "ON" : "OFF"}
                                </Badge>
                              </ContextMenuItem>

                              <ContextMenuItem
                                onClick={() => handleToggleFlag(org.id, org.name, "sandboxMode")}
                                className="cursor-pointer gap-2 justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Sandbox Mode</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono">
                                  {org.featureFlags.sandboxMode ? "ON" : "OFF"}
                                </Badge>
                              </ContextMenuItem>
                            </ContextMenuSubContent>
                          </ContextMenuSub>

                          <ContextMenuSeparator className="bg-border/40 my-1" />

                          <ContextMenuItem
                            onClick={() => handleCopy(org.slug, "Tenant Slug")}
                            className="cursor-pointer gap-2 focus:bg-muted"
                          >
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Copy Slug ({org.slug})</span>
                            <ContextMenuShortcut>C</ContextMenuShortcut>
                          </ContextMenuItem>

                          <ContextMenuItem
                            onClick={() => handleCopy(getTenantUrl(org.slug), "Tenant Portal URL")}
                            className="cursor-pointer gap-2 focus:bg-muted"
                          >
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Copy Portal URL</span>
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </OrganizationPageWrapper>
  );
}
