

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "@/lib/navigation-compat";
import { Link } from "@/lib/navigation-compat";
import { useSession } from "@/lib/auth-compat";
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
  DashboardPageSkeleton,
  ActionTooltip,
} from "@k2net/ui";
import {
  Building2,
  FileDown,
  Activity,
  Network,
  Globe,
  Users,
  FileText,
  Webhook,
  Database,
  CreditCard,
  History,
  ShieldAlert,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { getTenantUrl } from "@/lib/domain";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { cn } from "@/lib/utils";

// Types & Modular Sub-Tabs
import {
  type EnrichedOrganization,
  type OrganizationStatus,
  normalizePlanTier,
  toBackendPlanName,
  calculateTrialDaysLeft,
} from "@/components/organizations/types";
import { OrgOverviewTab } from "@/components/organizations/detail/OrgOverviewTab";
import { OrgHardwareTab } from "@/components/organizations/detail/OrgHardwareTab";
import { OrgNetworkDomainTab } from "@/components/organizations/detail/OrgNetworkDomainTab";
import { OrgTeamAccessTab } from "@/components/organizations/detail/OrgTeamAccessTab";
import { OrgDocumentsTab } from "@/components/organizations/detail/OrgDocumentsTab";
import { OrgApiWebhooksTab } from "@/components/organizations/detail/OrgApiWebhooksTab";
import { OrgDataBackupsTab } from "@/components/organizations/detail/OrgDataBackupsTab";
import { OrgBillingTab } from "@/components/organizations/detail/OrgBillingTab";
import { OrgAuditLogsTab } from "@/components/organizations/detail/OrgAuditLogsTab";
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
  | "documents"
  | "api"
  | "backups"
  | "billing"
  | "audit"
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
    const planTier = normalizePlanTier(rawOrg.subscriptionPlan?.name);
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
      planTier: planTier,
      createdAt: rawOrg.createdAt || "2026-08-20",

      picName: rawOrg.adminUsername ? `${rawOrg.adminUsername}` : "Andiansyah",
      picEmail: rawOrg.adminEmail || `admin@${rawOrg.slug}.kdua.net`,
      picPhone: "+62 812-8899-0011",
      slaTier: planTier === "Enterprise" ? "Platinum (99.9%)" : planTier === "Professional" ? "Gold (99.5%)" : "Standard (99.0%)",

      maxOlts: rawOrg.subscriptionPlan?.maxProjects || (planTier === "Enterprise" ? 20 : planTier === "Starter" ? 2 : 5),
      usedOlts: 2,
      maxOdps: rawOrg.subscriptionPlan?.maxOdps || (planTier === "Enterprise" ? 10000 : planTier === "Starter" ? 500 : 2500),
      usedOdps: 640,
      maxStorageGb: planTier === "Enterprise" ? 100 : planTier === "Starter" ? 10 : 25,
      usedStorageGb: 3.6,

      customDomain: rawOrg.website?.includes(".") && !rawOrg.website.includes("kdua.net") ? rawOrg.website.replace(/^https?:\/\//, "") : undefined,
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
      trialDaysLeft: calculateTrialDaysLeft(rawOrg.trialExpiresAt, status),
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
        setActiveTab("documents");
      } else if (e.key === "6") {
        setActiveTab("api");
      } else if (e.key === "7") {
        setActiveTab("backups");
      } else if (e.key === "8") {
        setActiveTab("billing");
      } else if (e.key === "9") {
        setActiveTab("audit");
      } else if (e.key === "0") {
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
      <div className="flex flex-col h-full w-full bg-background overflow-hidden">
        {/* ── 1. Top Linear Breadcrumbs Header ──────────────────────── */}
        <div className="px-6 py-3.5 border-b border-border/50 shrink-0 flex items-center justify-between bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/organizations"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Organizations
            </Link>
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

            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Copy Spec as Markdown"
            >
              <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Export Spec</span>
            </button>
          </div>
        </div>

        {/* ── 2. Linear Tabs Bar (Directly below Header Bar) ───────────── */}
        <div className="px-6 border-b border-border/40 shrink-0 bg-background/50 flex items-center gap-1 overflow-x-auto custom-scrollbar">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "hardware", label: "Hardware & OLTs", icon: Network },
            { id: "network", label: "Network & VPN", icon: Globe },
            { id: "team", label: "Team & Access", icon: Users },
            { id: "documents", label: "Documents & Legal", icon: FileText },
            { id: "api", label: "API & Webhooks", icon: Webhook },
            { id: "backups", label: "Data & Backups", icon: Database },
            { id: "billing", label: "Billing", icon: CreditCard },
            { id: "audit", label: "Audit & Logs", icon: History },
            { id: "danger", label: "Danger Zone", icon: ShieldAlert },
          ].map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const shortcutKey = idx === 9 ? "0" : `${idx + 1}`;
            return (
              <ActionTooltip key={tab.id} label={`Switch to ${tab.label}`} shortcut={shortcutKey}>
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

        {/* ── 3. Scrollable Tab Content Viewport ───────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 w-full">
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
          {activeTab === "documents" && (
            <OrgDocumentsTab organization={org} />
          )}
          {activeTab === "api" && (
            <OrgApiWebhooksTab organization={org} />
          )}
          {activeTab === "backups" && (
            <OrgDataBackupsTab
              organization={org}
              onOpenImportModal={() => {}}
            />
          )}
          {activeTab === "billing" && (
            <OrgBillingTab
              organization={org}
              onOpenPlanUpgrade={() => setQuotaModalOpen(true)}
            />
          )}
          {activeTab === "audit" && (
            <OrgAuditLogsTab organization={org} />
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
                  name: org.name,
                  subscriptionPlan: {
                    name: toBackendPlanName(quotas.planTier || org.planTier),
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
      </div>
    </OrganizationPageWrapper>
  );
}
