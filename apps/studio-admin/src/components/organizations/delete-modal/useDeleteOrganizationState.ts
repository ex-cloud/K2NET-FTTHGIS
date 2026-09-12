import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../types";

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

export function useDeleteOrganizationState(
  orgToDelete: EnrichedOrganization | null,
  accessToken?: string,
  deleteOrg?: (payload: { idOrSlug: string; mode: "soft" | "nuclear"; reason: string }) => Promise<unknown>,
  onClose?: () => void,
  onDeleteSuccess?: () => void
) {
  const [deleteMode, setDeleteMode] = useState<"soft" | "nuclear">("soft");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState("");
  const [confirmUnderstandNuclear, setConfirmUnderstandNuclear] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [checkedProjects] = useState<Record<string, boolean>>({});
  const [impactSummary, setImpactSummary] = useState<ImpactSummary | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!orgToDelete || !accessToken) {
      setProjects([]);
      setDeleteReason("");
      setDeleteConfirmSlug("");
      setDeleteMode("soft");
      setImpactSummary(null);
      setConfirmUnderstandNuclear(false);
      return;
    }

    const fetchDetails = async () => {
      setLoadingImpact(true);
      try {
        const [projRes, impactRes] = await Promise.all([
          fetch(`/api/v1/organizations/${orgToDelete.slug}/projects`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`/api/v1/organizations/${orgToDelete.slug}/impact-summary`, {
            headers: { Authorization: `Bearer ${accessToken}` },
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
        setLoadingImpact(false);
      }
    };
    fetchDetails();
  }, [orgToDelete, accessToken]);

  const handleExportBackup = async () => {
    if (!orgToDelete || !accessToken) return;
    setExportingBackup(true);
    try {
      const res = await fetch(`/api/v1/organizations/${orgToDelete.slug}/export-backup`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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
    } catch {
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
      onClose?.();
      onDeleteSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses penghapusan organisasi";
      toast.error(msg);
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

  return {
    deleteMode,
    setDeleteMode,
    deleteReason,
    setDeleteReason,
    deleteConfirmSlug,
    setDeleteConfirmSlug,
    confirmUnderstandNuclear,
    setConfirmUnderstandNuclear,
    impactSummary,
    loadingImpact,
    exportingBackup,
    deleting,
    canDelete,
    handleExportBackup,
    handleDelete,
  };
}
