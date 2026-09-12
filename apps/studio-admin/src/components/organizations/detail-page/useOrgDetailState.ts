import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "@/lib/navigation-compat";
import { useSession } from "@/lib/auth-compat";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import {
  type EnrichedOrganization,
  type OrganizationStatus,
  enrichOrganization,
} from "../types";
import type { DetailTab } from "./types";

export function useOrgDetailState() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const {
    organizations: rawOrgs,
    allStats = {},
    loading,
    refresh,
    updateOrganization,
    deleteOrg,
  } = useOrganizations();

  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  // Modals state
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [flagsModalOpen, setFlagsModalOpen] = useState(false);
  const [impersonateModalOpen, setImpersonateModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const rawOrg = useMemo(() => {
    return (rawOrgs || []).find(
      (o: Organization) => o.slug === slug || o.id === slug
    );
  }, [rawOrgs, slug]);

  const org: EnrichedOrganization | null = useMemo(() => {
    if (!rawOrg) return null;
    const stats = allStats[rawOrg.slug] || allStats[rawOrg.id || ""] || {};
    return enrichOrganization(rawOrg, stats);
  }, [rawOrg, allStats]);

  useEffect(() => {
    if (org) {
      document.title = `Organizations › ${org.name} | FTTH GIS K2NET`;
    }
  }, [org]);

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

  const handleImpersonate = () => {
    if (!org) return;
    setImpersonateModalOpen(true);
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

  return {
    slug,
    router,
    session,
    loading,
    refresh,
    updateOrganization,
    deleteOrg,
    org,
    activeTab,
    setActiveTab,
    domainModalOpen,
    setDomainModalOpen,
    quotaModalOpen,
    setQuotaModalOpen,
    flagsModalOpen,
    setFlagsModalOpen,
    impersonateModalOpen,
    setImpersonateModalOpen,
    deleteOpen,
    setDeleteOpen,
    handleImpersonate,
    handleUpdateStatus,
    handleExportMarkdown,
  };
}
