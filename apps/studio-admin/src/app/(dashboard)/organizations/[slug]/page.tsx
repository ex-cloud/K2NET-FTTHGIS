"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Button,
  Badge,
  Card,
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
  ActionTooltip,
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

  // Fetch projects on delete open
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        router.push("/organizations");
      } else if (e.key === "1") {
        setActiveTab("overview");
      } else if (e.key === "2") {
        setActiveTab("hardware");
      } else if (e.key === "3") {
        setActiveTab("network");
      } else if (e.key === "4") {
        setActiveTab("team");
      } else if (e.key === "5") {
        setActiveTab("features");
      } else if (e.key === "6") {
        setActiveTab("billing");
      } else if (e.key === "7") {
        setActiveTab("danger");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // Actions
  const handleImpersonate = () => {
    if (!org) return;
    const url = getTenantUrl(org.slug);
    toast.info(`Opening tenant workspace for ${org.name}...`);
    window.open(url, "_blank");
  };

  const handleUpdateStatus = async (status: OrganizationStatus) => {
    if (!org) return;
    try {
      await updateOrganization({
        slug: org.slug,
        org: { status },
      });
      toast.success(`Organization status updated to ${status}`);
      refresh();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleExportMarkdown = () => {
    if (!org) return;
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let md = `# Organization Technical Dossier: ${org.name}\n\n`;
    md += `> **Identifier:** \`ORG-${org.slug.toUpperCase()}\`  \n`;
    md += `> **Status:** ${org.status} | **Plan:** ${org.planTier} | **SLA:** ${org.slaTier}  \n`;
    md += `> **Technical PIC:** ${org.picName || "Andiansyah"} — \`${org.picEmail || "admin@" + org.slug + ".kdua.net"}\`  \n`;
    md += `> **Hardware Allocation:** ${org.usedOlts}/${org.maxOlts} OLTs | ${org.usedOdps}/${org.maxOdps} ODPs  \n`;
    md += `> **Storage (MinIO):** ${org.usedStorageGb}/${org.maxStorageGb} GB  \n`;
    md += `> **Export Timestamp:** ${dateStr}  \n\n`;
    md += `---\n\n`;
    md += `## 1. Feature Flags & Module Entitlements\n\n`;
    md += `- **GIS Core Engine:** ${org.featureFlags.gisCore ? "ENABLED" : "DISABLED"}\n`;
    md += `- **SNMP OLT Poller:** ${org.featureFlags.oltPoller ? "ENABLED" : "DISABLED"}\n`;
    md += `- **WhatsApp Engine (Twilio):** ${org.featureFlags.whatsappEngine ? "ENABLED" : "DISABLED"}\n`;
    md += `- **AI Fiber Copilot:** ${org.featureFlags.aiCopilot ? "ENABLED" : "DISABLED"}\n`;
    md += `- **Sandbox Mode:** ${org.featureFlags.sandboxMode ? "ACTIVE" : "INACTIVE"}\n\n`;
    md += `---\n\n`;
    md += `_Generated securely by K2NET FTTH GIS Multi-Tenant Command Center._\n`;

    navigator.clipboard
      .writeText(md)
      .then(() => {
        toast.success("Organization tech dossier copied to clipboard!");
      })
      .catch(() => {
        toast.info("Spec generated");
      });
  };

  const handleDelete = async () => {
    if (!org) return;
    setDeleting(true);
    try {
      await deleteOrg(org.id || org.slug);
      toast.success(`Organization ${org.name} deleted successfully`);
      setDeleteOpen(false);
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
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Organisasi Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Slug organisasi &quot;{slug}&quot; tidak terdaftar dalam database platform.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/organizations")}
            className="mt-4 text-xs gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke All Organizations</span>
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
            <ActionTooltip label="Back to Organizations list" shortcut="Esc">
              <Link
                href="/organizations"
                className="text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Organizations</span>
              </Link>
            </ActionTooltip>
            <span className="text-muted-foreground/60">›</span>
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>{org.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-mono border-border/80 bg-muted/40 text-muted-foreground">
              ORG-{org.slug.toUpperCase()}
            </Badge>

            <ActionTooltip label="Copy Technical Dossier as Markdown" shortcut="E">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMarkdown}
                className="h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs"
              >
                <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Export Spec</span>
              </Button>
            </ActionTooltip>

            <ActionTooltip label="Open Tenant Workspace Portal" shortcut="Ctrl+Enter">
              <Button
                size="sm"
                onClick={handleImpersonate}
                className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open Portal</span>
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* ── 2. Linear Tabs Bar (Directly below Header Bar) ───────────── */}
        <div className="px-6 border-b border-border/40 shrink-0 bg-background/50 flex items-center gap-1 overflow-x-auto custom-scrollbar">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "hardware", label: "Hardware & OLTs", icon: Network },
            { id: "network", label: "Domain & VPN", icon: Globe },
            { id: "team", label: "Team & Access", icon: Users },
            { id: "features", label: "Feature Flags", icon: Sliders },
            { id: "billing", label: "Billing & Invoices", icon: CreditCard },
            { id: "danger", label: "Danger Zone", icon: ShieldAlert },
          ].map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <ActionTooltip key={tab.id} label={`Switch to ${tab.label}`} shortcut={`${idx + 1}`}>
                <button
                  onClick={() => setActiveTab(tab.id as DetailTab)}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                    isActive
                      ? "border-primary text-foreground font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{tab.label}</span>
                </button>
              </ActionTooltip>
            );
          })}
        </div>

        {/* ── 3. Scrollable Body Content ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Header Card with Key Properties & Glowing Effect */}
          <Card glowingEffect className="p-5 space-y-4">
            {/* Top Identity Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono text-base shadow-xs">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base font-bold tracking-tight text-foreground">
                      {org.name}
                    </h1>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded border border-border/60">
                      slug: {org.slug}
                    </span>
                    <a
                      href={getTenantUrl(org.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary flex items-center gap-1 text-[11px] text-muted-foreground/80 font-mono underline"
                    >
                      <span>subdomain portal</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {org.description || "Enterprise FTTH ISP Tenant Environment"}
                  </p>
                </div>
              </div>

              {/* Status & Plan Badges */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-xs gap-1.5 px-2.5 py-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span>{org.status}</span>
                </Badge>
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 font-mono text-xs font-semibold px-2.5 py-1">
                  {org.planTier} PLAN
                </Badge>
              </div>
            </div>

            {/* Key Properties Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-border/50 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">Lead PIC</span>
                <span className="font-semibold text-foreground truncate block">{org.picName}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">SLA Support</span>
                <span className="font-semibold text-primary block">{org.slaTier}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">Hardware Slots</span>
                <span className="font-mono text-foreground block">{org.usedOlts}/{org.maxOlts} OLTs</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">ODP Quota</span>
                <span className="font-mono text-foreground block">{org.usedOdps}/{org.maxOdps}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">MinIO Storage</span>
                <span className="font-mono text-foreground block">{org.usedStorageGb}/{org.maxStorageGb} GB</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">API Latency</span>
                <span className="font-mono text-primary block">{org.apiLatencyMs} ms</span>
              </div>
            </div>
          </Card>

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
