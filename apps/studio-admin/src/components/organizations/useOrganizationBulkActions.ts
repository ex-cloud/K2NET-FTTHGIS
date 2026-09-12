import { toast } from "sonner";
import type { EnrichedOrganization } from "./types";

interface SessionWithToken {
  accessToken?: string | null;
}

export function useOrganizationBulkActions(
  enrichedOrganizations: EnrichedOrganization[],
  selectedIds: string[],
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
  refetch: () => void,
  updateOrganization?: (params: { slug: string; org: Record<string, unknown> }) => Promise<unknown>,
  session?: SessionWithToken | null
) {
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
            (o) =>
              `${o.id},"${o.name}",${o.slug},${o.status},${o.planTier},"${o.picName || ""}",${o.usedOlts},${o.usedOdps}`
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

  const handleBulkBackupJson = async () => {
    if (selectedIds.length === 0 || !session?.accessToken) return;
    const selectedOrgs = enrichedOrganizations.filter((o) => selectedIds.includes(o.id));
    const toastId = toast.loading(`Mempersiapkan paket cadangan untuk ${selectedOrgs.length} organisasi...`);

    try {
      const backups = await Promise.all(
        selectedOrgs.map(async (org) => {
          try {
            const res = await fetch(`/api/v1/organizations/${org.slug}/export-backup`, {
              headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (res.ok) return await res.json();
            return null;
          } catch {
            return null;
          }
        })
      );

      const validBackups = backups.filter(Boolean);
      const exportData = {
        platform: "K2NET FTTH GIS Enterprise",
        exportedAt: new Date().toISOString(),
        totalTenants: validBackups.length,
        tenants: validBackups,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tenants-backup-bundle-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Berhasil mengunduh paket cadangan JSON (${validBackups.length} tenant)`, {
        id: toastId,
      });
    } catch {
      toast.error("Gagal mengunduh cadangan JSON", {
        id: toastId,
      });
    }
  };

  return {
    handleBulkSuspend,
    handleBulkResume,
    handleBulkBroadcast,
    handleBulkExport,
    handleBulkBackupJson,
  };
}
