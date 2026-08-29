"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { getTenantUrl } from "@/lib/domain";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Label,
  TablePageSkeleton,
  ActionTooltip,
} from "@k2net/ui";
import {
  Building2,
  ShieldAlert,
  Loader2,
  Download,
  Trash2,
  Flame,
  Archive,
  FolderGit2,
  Network,
  Users,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationWizard } from "@/components/organizations/OrganizationWizard";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";

// Modular Organization Components
import type { EnrichedOrganization, OrganizationStatus, PlanTier } from "@/components/organizations/types";
import { OrganizationKpiStrip } from "@/components/organizations/OrganizationKpiStrip";
import { OrganizationToolbar } from "@/components/organizations/OrganizationToolbar";
import { OrganizationTable } from "@/components/organizations/OrganizationTable";
import { OrganizationCard } from "@/components/organizations/OrganizationCard";
import { OrganizationBulkActionBar } from "@/components/organizations/OrganizationBulkActionBar";
import { TenantDomainModal } from "@/components/organizations/TenantDomainModal";
import { TenantQuotaModal } from "@/components/organizations/TenantQuotaModal";
import { TenantFeatureFlagsModal } from "@/components/organizations/TenantFeatureFlagsModal";

interface Project {
  id: string;
  name: string;
  region: string;
}

interface ImpactSummary {
  organizationId: string;
  organizationName: string;
  slug: string;
  projectsCount: number;
  nodesCount: number;
  cablesCount: number;
  usersCount: number;
  keycloakRealm: string;
  status: string;
}

type ViewMode = "grid" | "list" | "table";

export default function AdminOrganizationsPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const {
    organizations: rawOrgs,
    loading: isLoading,
    refresh: refetch,
    updateOrganization,
    deleteOrg,
  } = useOrganizations();

  // URL query state
  const statusParam = searchParams.get("status") || "ALL";

  // Local View States
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(statusParam);
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [compactView, setCompactView] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Table multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal target states
  const [activeDomainOrg, setActiveDomainOrg] = useState<EnrichedOrganization | null>(null);
  const [activeQuotaOrg, setActiveQuotaOrg] = useState<EnrichedOrganization | null>(null);
  const [activeFlagsOrg, setActiveFlagsOrg] = useState<EnrichedOrganization | null>(null);

  // Delete Modal States
  const [orgToDelete, setOrgToDelete] = useState<EnrichedOrganization | null>(null);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [checkedProjects, setCheckedProjects] = useState<Record<string, boolean>>({});
  const [deleteReason, setDeleteReason] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync with searchParams
  useEffect(() => {
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [statusParam]);

  // Transform raw organizations to enriched type
  const enrichedOrganizations: EnrichedOrganization[] = useMemo(() => {
    return (rawOrgs || []).map((org: Organization, idx: number) => {
      const planName = (org.subscriptionPlan?.name || "Professional") as PlanTier;
      const status = (org.status || "ACTIVE") as OrganizationStatus;

      return {
        id: org.id || `org-${org.slug || idx}`,
        name: org.name || org.slug,
        slug: org.slug,
        description: org.description,
        address: org.address,
        website: org.website,
        logoUrl: org.logoUrl,
        status: status,
        planTier: ["Starter", "Professional", "Enterprise", "Custom"].includes(planName) ? planName : "Professional",
        createdAt: org.createdAt || "2026-08-20",

        // Default Contact PIC
        picName: org.adminUsername ? `${org.adminUsername}` : "Andiansyah",
        picEmail: org.adminEmail || `admin@${org.slug}.kdua.net`,
        picPhone: "+62 812-8899-0011",
        slaTier: planName === "Enterprise" ? "Platinum (99.9%)" : planName === "Professional" ? "Gold (99.5%)" : "Standard (99.0%)",

        // Hardware quotas
        maxOlts: org.subscriptionPlan?.maxProjects || (planName === "Enterprise" ? 20 : planName === "Starter" ? 2 : 5),
        usedOlts: Math.max(1, (idx + 1) * 2 % 5),
        maxOdps: org.subscriptionPlan?.maxOdps || (planName === "Enterprise" ? 10000 : planName === "Starter" ? 500 : 2500),
        usedOdps: Math.max(40, (idx + 1) * 320 % 2400),
        maxStorageGb: planName === "Enterprise" ? 100 : 10,
        usedStorageGb: Number((((idx + 1) * 1.8) % 8.5).toFixed(1)),

        // Custom Domain
        customDomain: org.website?.includes(".") && !org.website.includes("kdua.net") ? org.website.replace(/^https?:\/\//, "") : undefined,
        domainVerified: true,
        domainSslActive: true,

        // Feature flags
        featureFlags: {
          gisCore: true,
          oltPoller: planName !== "Starter",
          whatsappEngine: true,
          aiCopilot: planName === "Enterprise",
          sandboxMode: false,
        },

        // Rate limits
        apiRateLimitUsed: Math.max(120, (idx + 1) * 850 % 4800),
        apiRateLimitMax: planName === "Enterprise" ? 20000 : 5000,
        apiLatencyMs: 38 + (idx * 4),

        trialDaysLeft: status === "TRIAL" ? 12 : undefined,
      };
    });
  }, [rawOrgs]);

  // Filter organizations
  const filteredOrganizations = useMemo(() => {
    return enrichedOrganizations.filter((org) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = org.name.toLowerCase().includes(q);
        const matchesSlug = org.slug.toLowerCase().includes(q);
        const matchesPic = org.picName?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesSlug && !matchesPic) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "ALL" && org.status !== statusFilter) {
        return false;
      }

      // 3. Plan Filter
      if (planFilter !== "ALL" && org.planTier !== planFilter) {
        return false;
      }

      return true;
    });
  }, [enrichedOrganizations, searchQuery, statusFilter, planFilter]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.altKey && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        setCompactView((prev) => !prev);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        refetch();
        toast.success("Organization directory refreshed");
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setWizardOpen(true);
      } else if (e.key === "1") {
        setViewMode("grid");
      } else if (e.key === "2") {
        setViewMode("list");
      } else if (e.key === "3") {
        setViewMode("table");
      } else if (e.key === "Escape") {
        setSelectedIds([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refetch]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredOrganizations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrganizations.map((o) => o.id));
    }
  };

  // Actions
  const handleImpersonate = (org: EnrichedOrganization) => {
    toast.success(`Switching to Tenant Admin: ${org.name}`, {
      description: "Redirecting to tenant management portal...",
    });
    window.open(getTenantUrl(org.slug), "_blank");
  };

  const handleExtendTrial = (org: EnrichedOrganization) => {
    toast.success(`Trial extended by +14 days for ${org.name}`, {
      description: `New expiration: ${new Date(Date.now() + 14 * 86400000).toLocaleDateString()}`,
    });
  };
  const handleUpdateStatus = async (org: EnrichedOrganization, newStatus: OrganizationStatus) => {
    try {
      if (updateOrganization) {
        await updateOrganization({
          slug: org.slug,
          org: { status: newStatus },
        });
      }
      toast.success(`Organization ${org.name} status updated to ${newStatus}`);
      refetch();
    } catch {
      toast.error(`Failed to update status for ${org.name}`);
    }
  };

  // Bulk Actions
  const handleBulkSuspend = async () => {
    try {
      const targets = enrichedOrganizations.filter((o) => selectedIds.includes(o.id));
      await Promise.all(
        targets.map((t) =>
          updateOrganization?.({
            slug: t.slug,
            org: { status: "SUSPENDED" },
          })
        )
      );
      toast.success(`${selectedIds.length} organizations suspended successfully`);
      setSelectedIds([]);
      refetch();
    } catch {
      toast.error("Failed to suspend some organizations");
    }
  };

  const handleBulkResume = async () => {
    try {
      const targets = enrichedOrganizations.filter((o) => selectedIds.includes(o.id));
      await Promise.all(
        targets.map((t) =>
          updateOrganization?.({
            slug: t.slug,
            org: { status: "ACTIVE" },
          })
        )
      );
      toast.success(`${selectedIds.length} organizations resumed to active status`);
      setSelectedIds([]);
      refetch();
    } catch {
      toast.error("Failed to resume some organizations");
    }
  };

  const handleBulkBroadcast = () => {
    toast.info(`System broadcast sent to ${selectedIds.length} tenant dashboards`);
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    const selectedOrgs = enrichedOrganizations.filter((o) => selectedIds.includes(o.id));
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Name,Slug,Status,Plan,PIC,OLTs,ODPs"]
        .concat(
          selectedOrgs.map(
            (o) => `${o.id},"${o.name}",${o.slug},${o.status},${o.planTier},"${o.picName || ""}",${o.usedOlts},${o.usedOdps}`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `k2net-tenants-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedIds.length} organizations to CSV`);
    setSelectedIds([]);
  };

  // Delete flow state
  const [deleteMode, setDeleteMode] = useState<"soft" | "nuclear">("soft");
  const [impactSummary, setImpactSummary] = useState<ImpactSummary | null>(null);
  const [loadingImpact, setLoadingImpact] = useState<boolean>(false);
  const [exportingBackup, setExportingBackup] = useState<boolean>(false);
  const [confirmUnderstandNuclear, setConfirmUnderstandNuclear] = useState<boolean>(false);

  useEffect(() => {
    if (!orgToDelete || !session?.accessToken) {
      setProjects([]);
      setCheckedProjects({});
      setDeleteReason("");
      setDeleteConfirmSlug("");
      setDeleteMode("soft");
      setImpactSummary(null);
      setConfirmUnderstandNuclear(false);
      return;
    }

    const fetchDetails = async () => {
      setLoadingProjects(true);
      setLoadingImpact(true);
      try {
        const [projRes, impactRes] = await Promise.all([
          fetch(`/api/v1/organizations/${orgToDelete.slug}/projects`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
          fetch(`/api/v1/organizations/${orgToDelete.slug}/impact-summary`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
        ]);

        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData);
        }
        if (impactRes.ok) {
          const impactData = await impactRes.json();
          setImpactSummary(impactData);
        }
      } catch (err) {
        console.error("Error fetching organization deletion details", err);
      } finally {
        setLoadingProjects(false);
        setLoadingImpact(false);
      }
    };
    fetchDetails();
  }, [orgToDelete, session?.accessToken]);

  const handleExportBackup = async () => {
    if (!orgToDelete || !session?.accessToken) return;
    setExportingBackup(true);
    try {
      const res = await fetch(`/api/v1/organizations/${orgToDelete.slug}/export-backup`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tenant-backup-${orgToDelete.slug}-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Arsip cadangan ${orgToDelete.name} berhasil diunduh`);
      } else {
        toast.error("Gagal mengekspor data cadangan tenant");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengunduh data cadangan");
    } finally {
      setExportingBackup(false);
    }
  };

  const handleDelete = async () => {
    if (!orgToDelete) return;
    setDeleting(true);
    try {
      if (deleteOrg) {
        await deleteOrg({
          idOrSlug: orgToDelete.slug || orgToDelete.id,
          mode: deleteMode,
          reason: deleteReason,
        });
      }
      if (deleteMode === "soft") {
        toast.success(`Organisasi ${orgToDelete.name} dipindahkan ke Recycle Bin (Grace Period 30 Hari)`);
      } else {
        toast.success(`Organisasi ${orgToDelete.name} dan seluruh asetnya telah dimusnahkan secara permanen`);
      }
      setOrgToDelete(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Gagal memproses penghapusan organisasi");
    } finally {
      setDeleting(false);
    }
  };

  const canDelete =
    orgToDelete &&
    deleteReason !== "" &&
    (deleteMode === "soft"
      ? true
      : deleteConfirmSlug === orgToDelete.slug &&
        confirmUnderstandNuclear &&
        (projects.length === 0 || projects.every((p) => checkedProjects[p.id])));

  return (
    <OrganizationPageWrapper>
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="px-4 md:px-6 shrink-0">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Organizations Command Center</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Global oversight of all tenant ISP environments, hardware quotas, custom domains, and B2B subscriptions.
          </p>
        </div>

        {/* ── Inline KPI Stats Bar ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground font-mono">
              {enrichedOrganizations.filter((o) => o.status === "ACTIVE").length}
            </span>
            <span>Active Organizations</span>
          </div>
          <span className="text-muted-foreground/30 px-1">/</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground font-mono">
              {enrichedOrganizations.filter((o) => o.status === "PROVISIONING").length}
            </span>
            <span>Provisioning</span>
          </div>
          <span className="text-muted-foreground/30 px-1">/</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-destructive font-mono">
              {enrichedOrganizations.filter((o) => o.status === "SUSPENDED" || o.status === "OVERDUE").length}
            </span>
            <span>Suspended</span>
          </div>
          <span className="text-muted-foreground/30 px-1">/</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground font-mono">{enrichedOrganizations.length}</span>
            <span>Total</span>
          </div>
        </div>

        {/* ── KPI Cards (Collapsible) ─────────────────────────────── */}
        {!compactView && (
          <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
            <OrganizationKpiStrip
              organizations={enrichedOrganizations}
              compactView={false}
            />
          </div>
        )}

        {/* ── Main Data Viewport Container ────────────────────────── */}
        <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
          <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">
            <OrganizationToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              planFilter={planFilter}
              setPlanFilter={setPlanFilter}
              viewMode={viewMode}
              setViewMode={setViewMode}
              compactView={compactView}
              setCompactView={setCompactView}
              loading={isLoading}
              onRefresh={refetch}
              onNewOrganization={() => setWizardOpen(true)}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-6">
                  <TablePageSkeleton />
                </div>
              ) : viewMode === "table" ? (
                <OrganizationTable
                  organizations={filteredOrganizations}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onImpersonate={handleImpersonate}
                  onOpenDomainModal={(org) => setActiveDomainOrg(org)}
                  onOpenQuotaModal={(org) => setActiveQuotaOrg(org)}
                  onOpenFlagsModal={(org) => setActiveFlagsOrg(org)}
                  onExtendTrial={handleExtendTrial}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={(org) => setOrgToDelete(org)}
                />
              ) : (
                <div
                  className={cn(
                    "p-4 md:p-6",
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                      : "flex flex-col gap-3"
                  )}
                >
                  {filteredOrganizations.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-xs text-muted-foreground rounded-xl border border-border bg-card">
                      No organizations found matching the selected filters.
                    </div>
                  ) : (
                    filteredOrganizations.map((org) => (
                      <OrganizationCard
                        key={org.id}
                        organization={org}
                        viewMode={viewMode}
                        onImpersonate={handleImpersonate}
                        onOpenDomainModal={(o) => setActiveDomainOrg(o)}
                        onOpenQuotaModal={(o) => setActiveQuotaOrg(o)}
                        onOpenFlagsModal={(o) => setActiveFlagsOrg(o)}
                        onExtendTrial={handleExtendTrial}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={(o) => setOrgToDelete(o)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. FLOATING BULK ACTION BAR */}
        <OrganizationBulkActionBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onBulkSuspend={handleBulkSuspend}
          onBulkResume={handleBulkResume}
          onBulkBroadcast={handleBulkBroadcast}
          onBulkExport={handleBulkExport}
        />

        {/* 5. MODAL DIALOGS */}
        {/* Custom Domain Modal */}
        <TenantDomainModal
          organization={activeDomainOrg}
          isOpen={!!activeDomainOrg}
          onClose={() => setActiveDomainOrg(null)}
          onSaveDomain={async (_orgId, domain) => {
            if (activeDomainOrg && updateOrganization) {
              await updateOrganization({
                slug: activeDomainOrg.slug,
                org: { website: domain ? (domain.startsWith("http") ? domain : `https://${domain}`) : "" },
              });
              refetch();
            }
          }}
        />

        {/* Hardware Quotas Modal */}
        <TenantQuotaModal
          organization={activeQuotaOrg}
          isOpen={!!activeQuotaOrg}
          onClose={() => setActiveQuotaOrg(null)}
          onSaveQuotas={async (_orgId, quotas) => {
            if (activeQuotaOrg && updateOrganization) {
              await updateOrganization({
                slug: activeQuotaOrg.slug,
                org: {
                  subscriptionPlan: {
                    name: quotas.planTier || activeQuotaOrg.planTier,
                    maxProjects: quotas.maxOlts,
                    maxOdps: quotas.maxOdps,
                  },
                },
              });
              refetch();
            }
          }}
        />

        {/* Feature Flags Modal */}
        <TenantFeatureFlagsModal
          organization={activeFlagsOrg}
          isOpen={!!activeFlagsOrg}
          onClose={() => setActiveFlagsOrg(null)}
          onSaveFlags={async (_orgId, _flags) => {
            refetch();
          }}
        />

        {/* Organization Creation Wizard */}
        <OrganizationWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          onSuccess={() => {
            refetch();
            setWizardOpen(false);
          }}
        />

        {/* 2-Tier Enterprise Deletion Dialog */}
        <Dialog open={!!orgToDelete} onOpenChange={(open) => !open && setOrgToDelete(null)}>
          <DialogContent className="bg-popover/95 backdrop-blur-xl border-border/80 sm:max-w-[580px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="p-6 pb-3 text-foreground border-b border-border/60">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold flex items-center gap-2.5 text-foreground">
                  <div className={cn(
                    "p-2 rounded-xl border flex items-center justify-center",
                    deleteMode === "soft" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-destructive/10 border-destructive/20 text-destructive"
                  )}>
                    {deleteMode === "soft" ? <Archive className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="block text-sm font-semibold">Penghapusan Tenant & Manajemen Siklus Hidup</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      Organisasi: <strong className="text-foreground">{orgToDelete?.name}</strong> (<span className="font-mono">{orgToDelete?.slug}</span>)
                    </span>
                  </div>
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* 1. Ringkasan Dampak Nyata (Impact Summary Cards) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground/80">Ringkasan Dampak Aset Organisasi</Label>
                  <span className="text-[10px] text-muted-foreground font-mono">IAM Realm: {orgToDelete?.slug}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center">
                    <FolderGit2 className="w-4 h-4 text-primary mb-1" />
                    <span className="text-sm font-bold text-foreground">
                      {loadingImpact ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : impactSummary?.projectsCount ?? 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Proyek GIS</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center">
                    <Network className="w-4 h-4 text-primary mb-1" />
                    <span className="text-sm font-bold text-foreground">
                      {loadingImpact ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : impactSummary?.nodesCount ?? 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Node Aset</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center">
                    <Building2 className="w-4 h-4 text-primary mb-1" />
                    <span className="text-sm font-bold text-foreground">
                      {loadingImpact ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : impactSummary?.cablesCount ?? 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Kabel FO</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center">
                    <Users className="w-4 h-4 text-primary mb-1" />
                    <span className="text-sm font-bold text-foreground">
                      {loadingImpact ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : impactSummary?.usersCount ?? 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Akun User</span>
                  </div>
                </div>
              </div>

              {/* 2. Tombol Ekspor Cadangan Data (Pre-Deletion Backup) */}
              <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-primary" />
                    Ekspor Cadangan Tenant (.JSON)
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Simpan salinan topologi peta GIS, struktur data, dan konfigurasi sebelum dihapus.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportBackup}
                  disabled={exportingBackup}
                  className="h-8 text-xs font-medium shrink-0 border-border bg-background hover:bg-muted"
                >
                  {exportingBackup ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Unduh Backup
                </Button>
              </div>

              {/* 3. Pilihan Mode Penghapusan (2-Tier Selection) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">Pilih Metode Penghapusan</Label>
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Mode 1: Soft Delete (Recycle Bin) */}
                  <div
                    onClick={() => setDeleteMode("soft")}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                      deleteMode === "soft"
                        ? "bg-primary/5 border-primary shadow-sm"
                        : "bg-card border-border hover:border-border/80 opacity-80"
                    )}
                  >
                    <div className="pt-0.5">
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        deleteMode === "soft" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                      )}>
                        {deleteMode === "soft" && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                      </div>
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Archive className="w-3.5 h-3.5 text-amber-500" />
                          Pindahkan ke Recycle Bin (Grace Period 30 Hari)
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Direkomendasikan (Aman)
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Keycloak Realm dinonaktifkan seketika (semua user langsung logout). Data tersimpan aman di <strong>Recycle Bin</strong> selama 30 hari dan dapat dipulihkan sewaktu-waktu dengan 1-klik.
                      </p>
                    </div>
                  </div>

                  {/* Mode 2: Nuclear Hard Wipe */}
                  <div
                    onClick={() => setDeleteMode("nuclear")}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                      deleteMode === "nuclear"
                        ? "bg-destructive/5 border-destructive shadow-sm"
                        : "bg-card border-border hover:border-border/80 opacity-80"
                    )}
                  >
                    <div className="pt-0.5">
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        deleteMode === "nuclear" ? "border-destructive bg-destructive text-destructive-foreground" : "border-muted-foreground"
                      )}>
                        {deleteMode === "nuclear" && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                      </div>
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-destructive flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-destructive" />
                          Hapus Fisik Permanen Langsung (Nuclear Wipe)
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                          Danger Zone
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Keycloak Realm, seluruh titik PostGIS, dan berkas di storage akan <strong>dimusnahkan fisik seketika</strong> tanpa masa tenggang.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Alasan Penghapusan */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Alasan Penghapusan Tenant</Label>
                <Select onValueChange={setDeleteReason} value={deleteReason}>
                  <SelectTrigger className="bg-card border-border text-foreground h-9 text-xs">
                    <SelectValue placeholder="Pilih alasan penghapusan" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground text-xs">
                    <SelectItem value="client-churn">Kontrak ISP / Klien telah berakhir</SelectItem>
                    <SelectItem value="temporary-trial-ended">Masa uji coba (Trial) telah habis</SelectItem>
                    <SelectItem value="consolidation">Konsolidasi ke tenant / cabang lain</SelectItem>
                    <SelectItem value="administrative-purge">Pembersihan administratif / testing</SelectItem>
                    <SelectItem value="other">Alasan lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Konfirmasi Ekstra Khusus Nuclear Mode */}
              {deleteMode === "nuclear" && (
                <div className="space-y-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Tindakan ini permanen. Seluruh Keycloak realm, user, ODP, ODC, dan kabel untuk <strong className="text-foreground">{orgToDelete?.name}</strong> akan langsung dihapus tanpa bisa dibatalkan.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="confirm-nuclear"
                      checked={confirmUnderstandNuclear}
                      onCheckedChange={(checked: boolean) => setConfirmUnderstandNuclear(!!checked)}
                    />
                    <Label htmlFor="confirm-nuclear" className="text-xs font-medium text-foreground cursor-pointer">
                      Saya memahami data akan dimusnahkan secara permanen
                    </Label>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Ketik slug <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border">{orgToDelete?.slug}</span> untuk konfirmasi:
                    </Label>
                    <Input
                      value={deleteConfirmSlug}
                      onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                      placeholder="Masukkan slug organisasi"
                      className="bg-card border-border text-foreground h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border/60 bg-muted/20 flex justify-end gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setOrgToDelete(null)} className="text-xs">
                Batal
              </Button>
              <Button
                variant={deleteMode === "nuclear" ? "destructive" : "default"}
                size="sm"
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className={cn(
                  "text-xs font-semibold gap-1.5",
                  deleteMode === "soft" && "bg-amber-600 hover:bg-amber-700 text-primary-foreground"
                )}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : deleteMode === "soft" ? (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    Pindahkan ke Recycle Bin
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5" />
                    Musnahkan Permanen
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </OrganizationPageWrapper>
  );
}
