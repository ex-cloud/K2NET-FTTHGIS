import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/lib/navigation-compat";
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
  FlaskConical,
  Network,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import {
  type EnrichedOrganization,
  type OrganizationFeatureFlags,
  type OrganizationStatus,
  normalizePlanTier,
} from "@/components/organizations/types";
import { getTenantUrl } from "@/lib/domain";
import { cn } from "@/lib/utils";

export default function OrganizationFeaturesPage() {
  const router = useRouter();
  const { organizations: rawOrgs, allStats, loading, refresh, updateFeatureFlags } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [flagsState, setFlagsState] = useState<Record<string, OrganizationFeatureFlags>>({});

  // Transform raw organizations to enriched type with persisted feature flags from backend
  const organizations: EnrichedOrganization[] = useMemo(() => {
    return (rawOrgs || []).map((o: Organization) => {
      const planTier = normalizePlanTier(o.subscriptionPlan?.name);
      const status = (o.status || "ACTIVE") as OrganizationStatus;
      const stats = allStats[o.slug] || allStats[o.id || ""] || {};

      // Default feature flags based on persisted backend flags or plan tier defaults
      const persistedFlags = stats.featureFlags as OrganizationFeatureFlags | undefined;
      const defaultFlags: OrganizationFeatureFlags = {
        gisCore: persistedFlags?.gisCore ?? true,
        oltPoller: persistedFlags?.oltPoller ?? (planTier !== "Starter"),
        whatsappEngine: persistedFlags?.whatsappEngine ?? true,
        aiCopilot: persistedFlags?.aiCopilot ?? (planTier === "Enterprise"),
        sandboxMode: persistedFlags?.sandboxMode ?? false,
      };

      const customFlags = flagsState[o.slug] || flagsState[o.id || ""] || defaultFlags;

      return {
        id: o.id || `org-${o.slug}`,
        name: o.name || o.slug,
        slug: o.slug,
        description: o.description,
        address: o.address,
        website: o.website,
        logoUrl: o.logoUrl,
        status: status,
        planTier: planTier,
        createdAt: o.createdAt || "2026-08-20",

        picName: o.adminUsername ? `${o.adminUsername}` : "—",
        picEmail: o.adminEmail || `${o.slug}@kdua.net`,
        picPhone: "+62 812-8899-0011",
        slaTier: planTier === "Enterprise" ? "Platinum (99.9%)" : planTier === "Professional" ? "Gold (99.5%)" : "Standard (99.0%)",

        maxOlts: o.subscriptionPlan?.maxProjects || (planTier === "Enterprise" ? 20 : planTier === "Starter" ? 2 : 5),
        usedOlts: stats.usedOlts ?? 0,
        maxOdps: o.subscriptionPlan?.maxOdps || (planTier === "Enterprise" ? 10000 : planTier === "Starter" ? 500 : 2500),
        usedOdps: stats.usedOdps ?? 0,
        maxStorageGb: planTier === "Enterprise" ? 100 : planTier === "Starter" ? 10 : 25,
        usedStorageGb: stats.usedStorageGb ?? 0,

        customDomain: o.website?.includes(".") && !o.website.includes("kdua.net") ? o.website.replace(/^https?:\/\//, "") : undefined,
        domainVerified: true,
        domainSslActive: true,

        featureFlags: customFlags,

        apiRateLimitUsed: stats.apiRateLimitUsed ?? 0,
        apiRateLimitMax: planTier === "Enterprise" ? 20000 : planTier === "Starter" ? 2000 : 5000,
        apiLatencyMs: stats.apiLatencyMs ?? 0,
        trialDaysLeft: status === "TRIAL" ? 12 : undefined,
      };
    });
  }, [rawOrgs, flagsState, allStats]);

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
        toast.success("Entitlements refreshed from backend");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refresh]);

  // Toggle single flag with instant optimistic state & persistent backend save
  const handleToggleFlag = async (slug: string, orgName: string, flagKey: keyof OrganizationFeatureFlags) => {
    const currentOrg = organizations.find((o) => o.slug === slug);
    const currentFlags = currentOrg?.featureFlags || {
      gisCore: true,
      oltPoller: false,
      whatsappEngine: false,
      aiCopilot: false,
      sandboxMode: false,
    };
    const updatedFlags = { ...currentFlags, [flagKey]: !currentFlags[flagKey] };

    // Optimistic UI state
    setFlagsState((prev) => ({ ...prev, [slug]: updatedFlags }));

    try {
      await updateFeatureFlags({ slug, flags: updatedFlags });
      toast.success(`${flagKey} ${updatedFlags[flagKey] ? "diaktifkan" : "dinonaktifkan"} untuk ${orgName}`);
    } catch (err) {
      toast.error(`Gagal menyimpan fitur: ${err instanceof Error ? err.message : "Kesalahan server"}`);
      refresh();
    }
  };

  // Bulk enable AI copilot for Enterprise tenants
  const handleBulkEnableEnterpriseAI = async () => {
    const enterpriseOrgs = organizations.filter((o) => o.planTier === "Enterprise");
    if (enterpriseOrgs.length === 0) {
      toast.info("Tidak ada organisasi dengan paket Enterprise saat ini.");
      return;
    }

    try {
      for (const org of enterpriseOrgs) {
        const updated = { ...org.featureFlags, aiCopilot: true };
        setFlagsState((prev) => ({ ...prev, [org.slug]: updated }));
        await updateFeatureFlags({ slug: org.slug, flags: updated });
      }
      toast.success("AI Fiber Copilot berhasil diaktifkan untuk seluruh tenant Enterprise");
    } catch {
      toast.error("Gagal mengaktifkan AI Copilot secara massal");
      refresh();
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard`);
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
              Centralized B2B module entitlement & add-on management across all tenant organizations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Enable AI Fiber Copilot for all Enterprise organizations" shortcut="A">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkEnableEnterpriseAI}
                className="h-8 px-3 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span>Enable AI on Enterprise</span>
              </Button>
            </ActionTooltip>

            <ActionTooltip label="Refresh Entitlements from Database" shortcut="R">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refresh();
                  toast.success("Entitlements refreshed from backend");
                }}
                className="h-8 px-3 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs"
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
            <Card className="p-4 flex flex-col justify-between gap-3 bg-card/60 border-border/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
                  GIS Spatial Core
                </span>
                <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Map className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                    {Math.round((stats.gisCore / totalOrgs) * 100)}%
                  </p>
                  <span className="text-xs font-mono text-muted-foreground">
                    {stats.gisCore}/{totalOrgs} Tenants
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Core map engine active</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(stats.gisCore / totalOrgs) * 100}%` }}
                />
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between gap-3 bg-card/60 border-border/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
                  OLT Telemetry Poller
                </span>
                <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Radio className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                    {Math.round((stats.oltPoller / totalOrgs) * 100)}%
                  </p>
                  <span className="text-xs font-mono text-muted-foreground">
                    {stats.oltPoller}/{totalOrgs} Tenants
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">SNMP & SSH telemetry active</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(stats.oltPoller / totalOrgs) * 100}%` }}
                />
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between gap-3 bg-card/60 border-border/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
                  WhatsApp Engine
                </span>
                <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                    {Math.round((stats.whatsapp / totalOrgs) * 100)}%
                  </p>
                  <span className="text-xs font-mono text-blue-500">
                    {stats.whatsapp}/{totalOrgs} Tenants
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Automated billing notices</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.whatsapp / totalOrgs) * 100}%` }}
                />
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between gap-3 bg-card/60 border-border/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
                  AI Fiber Copilot
                </span>
                <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                    {Math.round((stats.aiCopilot / totalOrgs) * 100)}%
                  </p>
                  <span className="text-xs font-mono text-purple-500">
                    {stats.aiCopilot}/{totalOrgs} Tenants
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Automated cable routing AI</p>
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

        {/* ── 3. Plan Tier Entitlement Rules Legend ────────────────── */}
        <div className="px-4 md:px-6 shrink-0">
          <div className="rounded-xl border border-border/80 bg-card/40 backdrop-blur-md p-3 px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Info className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Default Entitlement:</span>
                <span className="text-muted-foreground ml-1.5">
                  <strong className="text-muted-foreground">Starter</strong> (GIS Core + WA) • <strong className="text-primary">Professional</strong> (+ OLT Poller) • <strong className="text-purple-400">Enterprise</strong> (+ AI Copilot).
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>Toggle switch menyimpan add-on kustom langsung ke PostgreSQL</span>
            </div>
          </div>
        </div>

        {/* ── 4. Filter Toolbar & Table Card ──────────────────────── */}
        <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
          <div className="flex-1 min-h-0 border border-border bg-card/30 rounded-xl overflow-hidden flex flex-col shadow-xs">
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
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[130px]">
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
                      <TableCell colSpan={8} className="h-48 text-center text-muted-foreground text-xs font-mono">
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

                            {/* Plan Tier Badge with distinctive semantic colors */}
                            <TableCell className="py-3.5">
                              {org.planTier === "Enterprise" ? (
                                <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-400 font-mono text-[10px] font-bold tracking-wider">
                                  ENTERPRISE
                                </Badge>
                              ) : org.planTier === "Professional" ? (
                                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-bold tracking-wider">
                                  PROFESSIONAL
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-border bg-muted/40 text-muted-foreground font-mono text-[10px] font-semibold tracking-wider">
                                  STARTER
                                </Badge>
                              )}
                            </TableCell>

                            {/* GIS Core Toggle */}
                            <TableCell className="py-3.5 text-center">
                              <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <ActionTooltip label={`Toggle GIS Core for ${org.name}`}>
                                  <Switch
                                    checked={org.featureFlags.gisCore}
                                    onCheckedChange={() => handleToggleFlag(org.slug, org.name, "gisCore")}
                                  />
                                </ActionTooltip>
                                <span className={cn(
                                  "text-[10px] font-mono font-bold w-6 text-left transition-colors",
                                  org.featureFlags.gisCore ? "text-primary" : "text-muted-foreground/40"
                                )}>
                                  {org.featureFlags.gisCore ? "ON" : "OFF"}
                                </span>
                              </div>
                            </TableCell>

                            {/* OLT Poller Toggle */}
                            <TableCell className="py-3.5 text-center">
                              <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <ActionTooltip label={`Toggle OLT Poller for ${org.name}`}>
                                  <Switch
                                    checked={org.featureFlags.oltPoller}
                                    onCheckedChange={() => handleToggleFlag(org.slug, org.name, "oltPoller")}
                                  />
                                </ActionTooltip>
                                <span className={cn(
                                  "text-[10px] font-mono font-bold w-6 text-left transition-colors",
                                  org.featureFlags.oltPoller ? "text-primary" : "text-muted-foreground/40"
                                )}>
                                  {org.featureFlags.oltPoller ? "ON" : "OFF"}
                                </span>
                              </div>
                            </TableCell>

                            {/* WhatsApp Engine Toggle */}
                            <TableCell className="py-3.5 text-center">
                              <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <ActionTooltip label={`Toggle WhatsApp Engine for ${org.name}`}>
                                  <Switch
                                    checked={org.featureFlags.whatsappEngine}
                                    onCheckedChange={() => handleToggleFlag(org.slug, org.name, "whatsappEngine")}
                                  />
                                </ActionTooltip>
                                <span className={cn(
                                  "text-[10px] font-mono font-bold w-6 text-left transition-colors",
                                  org.featureFlags.whatsappEngine ? "text-blue-500" : "text-muted-foreground/40"
                                )}>
                                  {org.featureFlags.whatsappEngine ? "ON" : "OFF"}
                                </span>
                              </div>
                            </TableCell>

                            {/* AI Copilot Toggle */}
                            <TableCell className="py-3.5 text-center">
                              <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <ActionTooltip label={`Toggle AI Copilot for ${org.name}`}>
                                  <Switch
                                    checked={org.featureFlags.aiCopilot}
                                    onCheckedChange={() => handleToggleFlag(org.slug, org.name, "aiCopilot")}
                                  />
                                </ActionTooltip>
                                <span className={cn(
                                  "text-[10px] font-mono font-bold w-6 text-left transition-colors",
                                  org.featureFlags.aiCopilot ? "text-purple-400" : "text-muted-foreground/40"
                                )}>
                                  {org.featureFlags.aiCopilot ? "ON" : "OFF"}
                                </span>
                              </div>
                            </TableCell>

                            {/* Sandbox Toggle */}
                            <TableCell className="py-3.5 text-center">
                              <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <ActionTooltip label={`Toggle Sandbox Mode for ${org.name}`}>
                                  <Switch
                                    checked={org.featureFlags.sandboxMode}
                                    onCheckedChange={() => handleToggleFlag(org.slug, org.name, "sandboxMode")}
                                  />
                                </ActionTooltip>
                                <span className={cn(
                                  "text-[10px] font-mono font-bold w-6 text-left transition-colors",
                                  org.featureFlags.sandboxMode ? "text-amber-500" : "text-muted-foreground/40"
                                )}>
                                  {org.featureFlags.sandboxMode ? "ON" : "OFF"}
                                </span>
                              </div>
                            </TableCell>

                            {/* Detail Link */}
                            <TableCell className="py-3.5 pr-6 text-right">
                              <ActionTooltip label={`Manage ${org.name} details`} shortcut="Enter">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/organizations/${org.slug}`)}
                                  className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 px-2 font-semibold"
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
                                onClick={() => handleToggleFlag(org.slug, org.name, "gisCore")}
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
                                onClick={() => handleToggleFlag(org.slug, org.name, "oltPoller")}
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
                                onClick={() => handleToggleFlag(org.slug, org.name, "whatsappEngine")}
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
                                onClick={() => handleToggleFlag(org.slug, org.name, "aiCopilot")}
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
                                onClick={() => handleToggleFlag(org.slug, org.name, "sandboxMode")}
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
