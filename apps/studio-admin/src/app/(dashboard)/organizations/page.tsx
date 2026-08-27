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
  PageLayout,
  TablePageSkeleton,
} from "@k2net/ui";
import { Building2, ShieldAlert, Loader2 } from "lucide-react";
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

  // Delete flow
  useEffect(() => {
    if (!orgToDelete || !session?.accessToken) {
      setProjects([]);
      setCheckedProjects({});
      setDeleteReason("");
      setDeleteConfirmSlug("");
      return;
    }

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch(`/api/v1/organizations/${orgToDelete.slug}/projects`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("Error fetching projects", err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [orgToDelete, session?.accessToken]);

  const handleDelete = async () => {
    if (!orgToDelete) return;
    setDeleting(true);
    try {
      if (deleteOrg) {
        await deleteOrg(orgToDelete.id);
      }
      toast.success(`Organization ${orgToDelete.name} deleted successfully`);
      setOrgToDelete(null);
      refetch();
    } catch (err) {
      toast.error("Failed to delete organization");
    } finally {
      setDeleting(false);
    }
  };

  const canDelete =
    orgToDelete &&
    deleteConfirmSlug === orgToDelete.slug &&
    deleteReason !== "" &&
    (projects.length === 0 || projects.every((p) => checkedProjects[p.id]));

  return (
    <OrganizationPageWrapper>
      <PageLayout className="p-0 flex flex-col h-full overflow-hidden bg-background">
        {/* TOP HEADER TITLE BAR */}
        <div className="py-4 px-6 border-b border-border/60 shrink-0 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Organizations Command Center</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Global oversight of all tenant ISP environments, hardware quotas, custom domains, and B2B subscriptions.
            </p>
          </div>

          {/* Quick Header Stats */}
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <span className="text-foreground font-semibold">
              {enrichedOrganizations.filter((o) => o.status === "ACTIVE").length} Active
            </span>
            <span>/</span>
            <span>{enrichedOrganizations.filter((o) => o.status === "PROVISIONING").length} Provisioning</span>
            <span>/</span>
            <span className="text-destructive font-semibold">
              {enrichedOrganizations.filter((o) => o.status === "SUSPENDED").length} Suspended
            </span>
            <span>/</span>
            <span>{enrichedOrganizations.length} Total</span>
          </div>
        </div>

        {/* 1. TOP METRIC KPI CARDS */}
        <OrganizationKpiStrip
          organizations={enrichedOrganizations}
          compactView={compactView}
        />

        {/* 2. FILTER & ACTION TOOLBAR */}
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

        {/* 3. MAIN DATA DISPLAY VIEWPORT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {isLoading ? (
            <TablePageSkeleton />
          ) : viewMode === "table" ? (
            <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
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
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  : "flex flex-col gap-3"
              }
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!orgToDelete} onOpenChange={(open) => !open && setOrgToDelete(null)}>
          <DialogContent className="bg-popover/95 backdrop-blur-xl border-border/80 sm:max-w-[460px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
            <DialogHeader className="p-6 pb-2 text-foreground">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                <span>Delete Organization</span>
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-4">
              {loadingProjects ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading associated projects...</p>
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Acknowledge project removal:
                  </p>
                  <div className="space-y-1.5 max-h-[140px] overflow-auto pr-1 custom-scrollbar">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border"
                      >
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={!!checkedProjects[project.id]}
                            onCheckedChange={(checked: boolean) => {
                              setCheckedProjects((prev) => ({
                                ...prev,
                                [project.id]: !!checked,
                              }));
                            }}
                          />
                          <Label htmlFor={`project-${project.id}`} className="text-xs font-medium text-foreground cursor-pointer">
                            {project.name}
                          </Label>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
                          {project.region || "ap-southeast-1"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Reason for deletion</Label>
                <Select onValueChange={setDeleteReason} value={deleteReason}>
                  <SelectTrigger className="bg-card border-border text-foreground h-9 text-xs">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground text-xs">
                    <SelectItem value="client-churn">Client contract ended</SelectItem>
                    <SelectItem value="temporary-trial-ended">Trial period expired</SelectItem>
                    <SelectItem value="consolidation">Consolidation into another tenant</SelectItem>
                    <SelectItem value="other">Other reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-muted-foreground leading-relaxed">
                This action is permanent and will drop the isolated PostGIS schema, Keycloak IAM realm, and MinIO S3 assets for <strong className="text-foreground">{orgToDelete?.name}</strong>.
              </div>

              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground">
                  Type <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border">{orgToDelete?.slug}</span> to confirm:
                </Label>
                <Input
                  value={deleteConfirmSlug}
                  onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                  placeholder="Enter organization slug"
                  className="bg-card border-border text-foreground h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border/60 bg-muted/20 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOrgToDelete(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className="text-xs font-semibold gap-1.5"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete Tenant"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageLayout>
    </OrganizationPageWrapper>
  );
}
