import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/lib/auth-compat";
import { toast } from "sonner";
import { GovernanceHealthBanner } from "@/components/governance-health-banner";
import {
  type Permission,
  type NewPermissionForm,
  type PermissionUsageResponse,
} from "@/components/security/permissions-types";
import { PermissionsToolbar } from "@/components/security/permissions-toolbar";
import { PermissionsGroupList } from "@/components/security/permissions-group-list";
import { TraceabilityModal } from "@/components/security/permissions-traceability-modal";
import { CreatePermissionDialog } from "@/components/security/permissions-create-dialog";
import { DeleteConfirmDialog } from "@/components/security/permissions-delete-dialog";

function groupByModule(permissions: Permission[]) {
  return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const key = (p.module || "other").toLowerCase();
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});
}

export default function PermissionsPage() {
  const { data: session } = useSession();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("ALL");

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Traceability Modal state
  const [selectedUsageCode, setSelectedUsageCode] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<PermissionUsageResponse | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Form state
  const [form, setForm] = useState<NewPermissionForm>({
    code: "",
    name: "",
    description: "",
    module: "",
    scope: "TENANT",
  });

  const fetchPermissions = useCallback(
    async (silent = false) => {
      if (!session?.accessToken) return;
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const res = await fetch("/api/v1/roles/permissions", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (!res.ok) throw new Error("Gagal memuat daftar permission");
        const data: Permission[] = await res.json();
        setPermissions(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [session?.accessToken]
  );

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const fetchUsages = async (code: string) => {
    setSelectedUsageCode(code);
    setLoadingUsage(true);
    try {
      const res = await fetch(`/api/v1/security/permissions/${encodeURIComponent(code)}/usages`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) throw new Error("Gagal memuat jejak endpoint");
      const data: PermissionUsageResponse = await res.json();
      setUsageData(data);
    } catch {
      toast.error("Gagal memuat traceability endpoint");
    } finally {
      setLoadingUsage(false);
    }
  };

  async function handleCreate() {
    if (!form.code.trim() || !form.name.trim() || !form.module.trim()) {
      toast.error("Code, Name, dan Module wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/roles/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal membuat permission");
      }
      toast.success(`Permission "${form.code}" berhasil ditambahkan`);
      setShowDialog(false);
      setForm({ code: "", name: "", description: "", module: "", scope: "TENANT" });
      await fetchPermissions(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/roles/permissions/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) throw new Error("Gagal menghapus permission");
      toast.success(`Permission "${deleteTarget.code}" berhasil dihapus`);
      setDeleteTarget(null);
      await fetchPermissions(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return permissions.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q);
      const matchScope = scopeFilter === "ALL" || p.scope === scopeFilter;
      return matchSearch && matchScope;
    });
  }, [permissions, search, scopeFilter]);

  const grouped = useMemo(() => groupByModule(filtered), [filtered]);
  const moduleKeys = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const stats = useMemo(
    () => [
      { label: "Total Permission", value: permissions.length, color: "text-foreground" },
      { label: "Module Aktif", value: Object.keys(groupByModule(permissions)).length, color: "text-sky-400" },
      {
        label: "Scope SYSTEM",
        value: permissions.filter((p) => p.scope === "SYSTEM").length,
        color: "text-primary",
      },
      {
        label: "Scope TENANT",
        value: permissions.filter((p) => p.scope === "TENANT").length,
        color: "text-primary",
      },
    ],
    [permissions]
  );

  return (
    <div className="flex-1 w-full min-w-0 p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto w-full pb-12">
        <GovernanceHealthBanner onSelectPermission={(code) => setSearch(code)} />

        <PermissionsToolbar
          onRefresh={() => fetchPermissions(true)}
          isRefreshing={isRefreshing}
          onOpenCreate={() => setShowDialog(true)}
          stats={stats}
          search={search}
          onSearchChange={setSearch}
          scopeFilter={scopeFilter}
          onScopeFilterChange={setScopeFilter}
        />

        <PermissionsGroupList
          isLoading={isLoading}
          moduleKeys={moduleKeys}
          grouped={grouped}
          onDelete={(p) => setDeleteTarget(p)}
          onViewUsages={fetchUsages}
        />
      </div>

      {/* Dialogs */}
      {showDialog && (
        <CreatePermissionDialog
          form={form}
          setForm={setForm}
          onClose={() => setShowDialog(false)}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          permission={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isSubmitting={isSubmitting}
        />
      )}

      <TraceabilityModal
        code={selectedUsageCode}
        data={usageData}
        loading={loadingUsage}
        onClose={() => setSelectedUsageCode(null)}
      />
    </div>
  );
}
