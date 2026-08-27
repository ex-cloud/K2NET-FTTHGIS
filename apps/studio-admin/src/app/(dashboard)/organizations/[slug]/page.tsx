"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  PageLayout,
  DashboardPageSkeleton,
} from "@k2net/ui";
import {
  Building2,
  ExternalLink,
  FileDown,
  Activity,
  Network,
  Globe,
  Users,
  Sliders,
  CreditCard,
  ShieldAlert,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { getTenantUrl } from "@/lib/domain";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { cn } from "@/lib/utils";

// Types & Modular Sub-Tabs
import type { EnrichedOrganization, OrganizationStatus, PlanTier } from "@/components/organizations/types";
import { OrgOverviewTab } from "@/components/organizations/detail/OrgOverviewTab";
import { OrgHardwareTab } from "@/components/organizations/detail/OrgHardwareTab";
import { OrgNetworkDomainTab } from "@/components/organizations/detail/OrgNetworkDomainTab";
import { OrgTeamAccessTab } from "@/components/organizations/detail/OrgTeamAccessTab";
import { OrgFeatureFlagsTab } from "@/components/organizations/detail/OrgFeatureFlagsTab";
import { OrgBillingTab } from "@/components/organizations/detail/OrgBillingTab";
import { OrgDangerZoneTab } from "@/components/organizations/detail/OrgDangerZoneTab";

// Modals
import { TenantDomainModal } from "@/components/organizations/TenantDomainModal";
import { TenantQuotaModal } from "@/components/organizations/TenantQuotaModal";
import { TenantFeatureFlagsModal } from "@/components/organizations/TenantFeatureFlagsModal";

type DetailTab =
  | "overview"
  | "hardware"
  | "network"
  | "team"
  | "features"
  | "billing"
  | "danger";

interface Project {
  id: string;
  name: string;
  region: string;
}

export default function OrganizationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { organizations: rawOrgs, loading, refresh, updateOrganization, deleteOrg } = useOrganizations();

  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  // Modals state
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [flagsModalOpen, setFlagsModalOpen] = useState(false);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [checkedProjects, setCheckedProjects] = useState<Record<string, boolean>>({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Find target organization
  const rawOrg = useMemo(() => {
    return (rawOrgs || []).find(
      (o: Organization) => o.slug === slug || o.id === slug
    );
  }, [rawOrgs, slug]);

  // Transform to Enriched Organization
  const org: EnrichedOrganization | null = useMemo(() => {
    if (!rawOrg) return null;
    const planName = (rawOrg.subscriptionPlan?.name || "Professional") as PlanTier;
    const status = (rawOrg.status || "ACTIVE") as OrganizationStatus;

    return {
      id: rawOrg.id || `org-${rawOrg.slug}`,
      name: rawOrg.name || rawOrg.slug,
      slug: rawOrg.slug,
      description: rawOrg.description,
      address: rawOrg.address,
      website: rawOrg.website,
      logoUrl: rawOrg.logoUrl,
      status: status,
      planTier: ["Starter", "Professional", "Enterprise", "Custom"].includes(planName) ? planName : "Professional",
      createdAt: rawOrg.createdAt || "2026-08-20",

      picName: rawOrg.adminUsername ? `${rawOrg.adminUsername}` : "Andiansyah",
      picEmail: rawOrg.adminEmail || `admin@${rawOrg.slug}.kdua.net`,
      picPhone: "+62 812-8899-0011",
      slaTier: planName === "Enterprise" ? "Platinum (99.9%)" : planName === "Professional" ? "Gold (99.5%)" : "Standard (99.0%)",

      maxOlts: rawOrg.subscriptionPlan?.maxProjects || (planName === "Enterprise" ? 20 : planName === "Starter" ? 2 : 5),
      usedOlts: 2,
      maxOdps: rawOrg.subscriptionPlan?.maxOdps || (planName === "Enterprise" ? 10000 : planName === "Starter" ? 500 : 2500),
      usedOdps: 640,
      maxStorageGb: planName === "Enterprise" ? 100 : 10,
      usedStorageGb: 3.6,

      customDomain: rawOrg.website?.includes(".") && !rawOrg.website.includes("kdua.net") ? rawOrg.website.replace(/^https?:\/\//, "") : undefined,
      domainVerified: true,
      domainSslActive: true,

      featureFlags: {
        gisCore: true,
        oltPoller: planName !== "Starter",
        whatsappEngine: true,
        aiCopilot: planName === "Enterprise",
        sandboxMode: false,
      },

      apiRateLimitUsed: 850,
      apiRateLimitMax: planName === "Enterprise" ? 20000 : 5000,
      apiLatencyMs: 38,
      trialDaysLeft: status === "TRIAL" ? 12 : undefined,
    };
  }, [rawOrg]);

  // Set document title
  useEffect(() => {
    if (org) {
      document.title = `Organizations › ${org.name} | FTTH GIS K2NET`;
    }
  }, [org]);

  // Export tech spec as Markdown
  const handleExportMarkdown = () => {
    if (!org) return;
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    let md = `# Organization Operational Specification: ${org.name}\n\n`;
    md += `> **Tenant Reference:** \`ORG-${org.slug.toUpperCase()}\`  \n`;
    md += `> **Status:** ${org.status} | **Plan Tier:** ${org.planTier} | **SLA:** ${org.slaTier}  \n`;
    md += `> **Technical PIC:** ${org.picName} (${org.picEmail})  \n`;
    md += `> **Custom Domain:** ${org.customDomain || org.slug + ".kdua.net"}  \n`;
    md += `> **Export Date:** ${dateStr}  \n\n`;
    md += `---\n\n`;
    md += `## 1. Hardware Allocation & Quotas\n\n`;
    md += `- **OLT Nodes:** ${org.usedOlts} / ${org.maxOlts} Allocated\n`;
    md += `- **ODP Splitters:** ${org.usedOdps} / ${org.maxOdps} Mapped\n`;
    md += `- **MinIO S3 Storage:** ${org.usedStorageGb} / ${org.maxStorageGb} GB\n`;
    md += `- **Kong API Rate Limit:** ${org.apiRateLimitUsed} / ${org.apiRateLimitMax} RPM\n\n`;
    md += `---\n\n`;
    md += `## 2. B2B Module Entitlements\n\n`;
    md += `- GIS Spatial Core: ${org.featureFlags.gisCore ? "Enabled" : "Disabled"}\n`;
    md += `- OLT SNMP/SSH Poller: ${org.featureFlags.oltPoller ? "Enabled" : "Disabled"}\n`;
    md += `- WhatsApp Notification Engine: ${org.featureFlags.whatsappEngine ? "Enabled" : "Disabled"}\n`;
    md += `- AI Fiber Routing Copilot: ${org.featureFlags.aiCopilot ? "Enabled" : "Disabled"}\n`;
    md += `- Sandbox Mode: ${org.featureFlags.sandboxMode ? "Enabled" : "Disabled"}\n`;

    navigator.clipboard.writeText(md).then(() => {
      toast.success("Organization specification markdown copied to clipboard!");
    }).catch(() => {
      toast.info("Specification markdown generated");
    });
  };

  const handleImpersonate = () => {
    if (!org) return;
    toast.success(`Switching to Tenant Admin: ${org.name}`, {
      description: "Redirecting to tenant management portal...",
    });
    window.open(getTenantUrl(org.slug), "_blank");
  };

  const handleUpdateStatus = async (newStatus: OrganizationStatus) => {
    if (!org) return;
    try {
      if (updateOrganization) {
        await updateOrganization({
          slug: org.slug,
          org: { status: newStatus },
        });
      }
      toast.success(`Status updated to ${newStatus} for ${org.name}`);
      refresh();
    } catch {
      toast.error(`Failed to update status for ${org.name}`);
    }
  };

  // Delete flow
  useEffect(() => {
    if (!deleteOpen || !org || !session?.accessToken) return;
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch(`/api/v1/organizations/${org.slug}/projects`, {
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
  }, [deleteOpen, org, session?.accessToken]);

  const handleDelete = async () => {
    if (!org) return;
    setDeleting(true);
    try {
      if (deleteOrg) {
        await deleteOrg(org.id);
      }
      toast.success(`Organization ${org.name} deleted successfully`);
      router.push("/organizations");
    } catch {
      toast.error("Failed to delete organization");
    } finally {
      setDeleting(false);
    }
  };

  const canDelete =
    org &&
    deleteConfirmSlug === org.slug &&
    deleteReason !== "" &&
    (projects.length === 0 || projects.every((p) => checkedProjects[p.id]));

  if (loading) {
    return (
      <OrganizationPageWrapper>
        <DashboardPageSkeleton />
      </OrganizationPageWrapper>
    );
  }

  if (!org) {
    return (
      <OrganizationPageWrapper>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">Organization Not Found</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Organisasi dengan slug <code className="text-primary font-mono">{slug}</code> tidak ditemukan atau telah dihapus dari sistem.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/organizations")}
            className="text-xs font-semibold gap-1.5 mt-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Direktori Organisasi</span>
          </Button>
        </div>
      </OrganizationPageWrapper>
    );
  }

  return (
    <OrganizationPageWrapper>
      <PageLayout className="p-0 flex flex-col h-full overflow-hidden bg-background">
        {/* ── 1. Top Linear Breadcrumbs Header ──────────────────────── */}
        <div className="px-6 py-3.5 border-b border-border/50 shrink-0 flex items-center justify-between bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/organizations"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Organizations</span>
            </Link>
            <span className="text-muted-foreground/60">›</span>
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>{org.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMarkdown}
              className="h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5"
              title="Copy Spec as Markdown"
            >
              <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Export Spec</span>
            </Button>

            <Button
              size="sm"
              onClick={handleImpersonate}
              className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
            >
              <span>Open Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* ── 2. Scrollable Body Content ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Header Card with Key Properties */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-6 space-y-5 shadow-xs">
            {/* Top Identity Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-secondary/90 border border-border flex items-center justify-center text-foreground font-bold font-mono text-xl shadow-xs">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold tracking-tight text-foreground">
                      {org.name}
                    </h1>
                    <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[10px] px-2 py-0.5">
                      ORG-{org.slug.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span>Slug: {org.slug}</span>
                    <span>•</span>
                    <a
                      href={getTenantUrl(org.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary flex items-center gap-0.5 underline text-muted-foreground/80"
                    >
                      <span>subdomain portal</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Status & Plan Badges */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-xs gap-1.5 px-2.5 py-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span>{org.status}</span>
                </Badge>
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 font-mono text-xs font-semibold px-2.5 py-1">
                  {org.planTier} Plan
                </Badge>
              </div>
            </div>

            {/* Key Properties Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-border/50 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Lead PIC</span>
                <span className="font-semibold text-foreground truncate block">{org.picName}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">SLA Support</span>
                <span className="font-semibold text-primary block">{org.slaTier}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Hardware Slots</span>
                <span className="font-mono text-foreground block">{org.usedOlts}/{org.maxOlts} OLTs</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">ODP Quota</span>
                <span className="font-mono text-foreground block">{org.usedOdps}/{org.maxOdps}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">MinIO Storage</span>
                <span className="font-mono text-foreground block">{org.usedStorageGb}/{org.maxStorageGb} GB</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">API Latency</span>
                <span className="font-mono text-primary block">{org.apiLatencyMs} ms</span>
              </div>
            </div>
          </div>

          {/* ── 3. Tabs Navigation Bar ────────────────────────────── */}
          <div className="flex items-center gap-1.5 border-b border-border/80 overflow-x-auto custom-scrollbar pb-px">
            {[
              { id: "overview", label: "Overview & Metrics", icon: Activity },
              { id: "hardware", label: "Hardware & OLTs", icon: Network },
              { id: "network", label: "Domain & VPN Tunnel", icon: Globe },
              { id: "team", label: "Team & Access", icon: Users },
              { id: "features", label: "Feature Flags", icon: Sliders },
              { id: "billing", label: "Billing & Invoices", icon: CreditCard },
              { id: "danger", label: "Danger Zone", icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DetailTab)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer",
                    isActive
                      ? "border-primary text-foreground bg-primary/5 rounded-t-lg font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-lg"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── 4. Tab Content Viewport ───────────────────────────── */}
          <div className="pt-2">
            {activeTab === "overview" && (
              <OrgOverviewTab
                organization={org}
                onOpenPlanUpgrade={() => setActiveTab("billing")}
              />
            )}
            {activeTab === "hardware" && (
              <OrgHardwareTab
                organization={org}
                onOpenQuotaModal={() => setQuotaModalOpen(true)}
              />
            )}
            {activeTab === "network" && (
              <OrgNetworkDomainTab
                organization={org}
                onOpenDomainModal={() => setDomainModalOpen(true)}
              />
            )}
            {activeTab === "team" && (
              <OrgTeamAccessTab organization={org} />
            )}
            {activeTab === "features" && (
              <OrgFeatureFlagsTab
                organization={org}
                onSaveFlags={() => refresh()}
              />
            )}
            {activeTab === "billing" && (
              <OrgBillingTab
                organization={org}
                onOpenPlanUpgrade={() => setQuotaModalOpen(true)}
              />
            )}
            {activeTab === "danger" && (
              <OrgDangerZoneTab
                organization={org}
                onImpersonate={handleImpersonate}
                onUpdateStatus={handleUpdateStatus}
                onDelete={() => setDeleteOpen(true)}
              />
            )}
          </div>
        </div>

        {/* ── 5. Modal Dialogs ──────────────────────────────────── */}
        <TenantDomainModal
          organization={org}
          isOpen={domainModalOpen}
          onClose={() => setDomainModalOpen(false)}
          onSaveDomain={async (_orgId, domain) => {
            if (org && updateOrganization) {
              await updateOrganization({
                slug: org.slug,
                org: { website: domain ? (domain.startsWith("http") ? domain : `https://${domain}`) : "" },
              });
              refresh();
            }
          }}
        />

        <TenantQuotaModal
          organization={org}
          isOpen={quotaModalOpen}
          onClose={() => setQuotaModalOpen(false)}
          onSaveQuotas={async (_orgId, quotas) => {
            if (org && updateOrganization) {
              await updateOrganization({
                slug: org.slug,
                org: {
                  subscriptionPlan: {
                    name: quotas.planTier || org.planTier,
                    maxProjects: quotas.maxOlts,
                    maxOdps: quotas.maxOdps,
                  },
                },
              });
              refresh();
            }
          }}
        />

        <TenantFeatureFlagsModal
          organization={org}
          isOpen={flagsModalOpen}
          onClose={() => setFlagsModalOpen(false)}
          onSaveFlags={async (_orgId, _flags) => {
            refresh();
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[460px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
            <DialogHeader className="p-6 pb-2 text-foreground">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                <span>Delete Organization Permanently</span>
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
                Tindakan ini permanen dan akan menghapus skema PostGIS terisolasi, realm Keycloak IAM, dan bucket MinIO S3 untuk <strong className="text-foreground">{org.name}</strong>.
              </div>

              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground">
                  Ketik <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border">{org.slug}</span> untuk konfirmasi:
                </Label>
                <Input
                  value={deleteConfirmSlug}
                  onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                  placeholder="Enter organization slug"
                  className="bg-card border-border text-foreground h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)} className="text-xs">
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
