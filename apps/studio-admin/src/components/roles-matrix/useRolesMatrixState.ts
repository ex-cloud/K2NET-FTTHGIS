import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import type { Role, Permission, RoleUserCount, ImpactData } from "./types";
import {
  fetchRolesAndPermissions,
  updateRolePermissions,
  fetchRoleUserCount,
} from "./rolesMatrixApi";

function filterPermissions(
  permissions: Permission[],
  searchQuery: string,
  diffOnly: boolean,
  roles: Role[],
  editedRoles: Record<number, Set<number>>
): Record<string, Permission[]> {
  const query = searchQuery.toLowerCase().trim();

  return permissions.reduce((acc, perm) => {
    if (query) {
      const matchCode = perm.code.toLowerCase().includes(query);
      const matchDesc = (perm.description || "").toLowerCase().includes(query);
      const matchModule = (perm.module || "").toLowerCase().includes(query);
      if (!matchCode && !matchDesc && !matchModule) return acc;
    }

    if (diffOnly && roles.length > 1) {
      const firstRoleState = editedRoles[roles[0].id]?.has(perm.id) ?? false;
      const hasDiff = roles.some(
        (r) => (editedRoles[r.id]?.has(perm.id) ?? false) !== firstRoleState
      );
      if (!hasDiff) return acc;
    }

    const mod = perm.module || "General";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);
}

export function useRolesMatrixState(context: "system" | "tenant") {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [diffOnly, setDiffOnly] = useState(false);
  const [selectedScope, setSelectedScope] = useState<"SYSTEM" | "TENANT">(
    context === "system" ? "SYSTEM" : "TENANT"
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRoleToSave, setPendingRoleToSave] = useState<Role | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [editedRoles, setEditedRoles] = useState<Record<number, Set<number>>>({});
  const [originalRoles, setOriginalRoles] = useState<Record<number, Set<number>>>({});

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const { roles: r, permissions: p } = await fetchRolesAndPermissions(
        selectedScope,
        session.accessToken,
        session.user?.roles || []
      );
      setRoles(r);
      setPermissions(p);
      const initial: Record<number, Set<number>> = {};
      r.forEach((role) => {
        initial[role.id] = new Set(role.permissions?.map((perm) => perm.id) || []);
      });
      setEditedRoles(initial);
      setOriginalRoles({ ...initial });
    } catch (error) {
      console.error("Failed to load roles:", error);
      toast.error("Failed to load roles data.");
    } finally {
      setLoading(false);
    }
  }, [session, selectedScope]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePermission = (roleId: number, permId: number) => {
    setEditedRoles((prev) => {
      const next = new Set(prev[roleId]);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return { ...prev, [roleId]: next };
    });
  };

  const isRoleModified = useCallback(
    (roleId: number) => {
      const curr = editedRoles[roleId];
      const orig = originalRoles[roleId];
      if (!curr || !orig || curr.size !== orig.size) return true;
      for (const val of Array.from(curr)) {
        if (!orig.has(val)) return true;
      }
      return false;
    },
    [editedRoles, originalRoles]
  );

  const hasAnyModifiedRoles = useMemo(
    () => roles.some((role) => isRoleModified(role.id)),
    [roles, isRoleModified]
  );

  const executeSaveRole = async (role: Role) => {
    if (!session?.accessToken) return;
    try {
      setSaving(role.id);
      const selected = Array.from(editedRoles[role.id] || []);
      await updateRolePermissions(role.id, selected, session.accessToken);
      toast.success(`${role.displayName || role.name} permissions updated successfully!`);
      setOriginalRoles((prev) => ({ ...prev, [role.id]: new Set(selected) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setSaving(null);
    }
  };

  const checkRevocationAndSave = async (role: Role) => {
    const orig = originalRoles[role.id] || new Set();
    const curr = editedRoles[role.id] || new Set();
    const revokedIds = Array.from(orig).filter((id) => !curr.has(id));
    const revoked = permissions.filter((p) => revokedIds.includes(p.id));

    if (revoked.length > 0 && session?.accessToken) {
      const count = await fetchRoleUserCount(role.id, session.accessToken);
      if (count && count.activeUserCount > 0) {
        setImpactData({
          roles: [role],
          userCounts: { [role.id]: count },
          revocations: { [role.id]: revoked },
          isBatch: false,
        });
        setImpactModalOpen(true);
        return;
      }
    }
    await executeSaveRole(role);
  };

  const executeBatchSave = async (modifiedRoles: Role[]) => {
    if (!session?.accessToken) return;
    try {
      setBatchSaving(true);
      for (const role of modifiedRoles) {
        const selected = Array.from(editedRoles[role.id] || []);
        await updateRolePermissions(role.id, selected, session.accessToken);
      }
      toast.success("Semua perubahan hak akses berhasil disimpan!");
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setBatchSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!session?.accessToken) return;
    const modified = roles.filter((role) => isRoleModified(role.id));
    if (modified.length === 0) return toast.info("Tidak ada perubahan untuk disimpan.");

    if (modified.some((r) => r.isSystemRole) && context !== "system") {
      setPendingRoleToSave(modified.find((r) => r.isSystemRole) || null);
      return setShowConfirmDialog(true);
    }

    const revocations: Record<number, Permission[]> = {};
    const userCounts: Record<number, RoleUserCount> = {};
    let totalAffected = 0;

    for (const role of modified) {
      const orig = originalRoles[role.id] || new Set();
      const curr = editedRoles[role.id] || new Set();
      const revIds = Array.from(orig).filter((id) => !curr.has(id));
      if (revIds.length > 0) {
        revocations[role.id] = permissions.filter((p) => revIds.includes(p.id));
        const count = await fetchRoleUserCount(role.id, session.accessToken);
        if (count) {
          userCounts[role.id] = count;
          totalAffected += count.activeUserCount;
        }
      }
    }

    if (totalAffected > 0) {
      setImpactData({ roles: modified, userCounts, revocations, isBatch: true });
      return setImpactModalOpen(true);
    }
    await executeBatchSave(modified);
  };

  const filteredGroupedPermissions = useMemo(
    () => filterPermissions(permissions, searchQuery, diffOnly, roles, editedRoles),
    [permissions, searchQuery, diffOnly, roles, editedRoles]
  );

  const totalFilteredPerms = useMemo(
    () => Object.values(filteredGroupedPermissions).reduce((sum, list) => sum + list.length, 0),
    [filteredGroupedPermissions]
  );

  return {
    roles,
    permissions,
    loading,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    diffOnly,
    setDiffOnly,
    selectedScope,
    setSelectedScope,
    showConfirmDialog,
    setShowConfirmDialog,
    pendingRoleToSave,
    setPendingRoleToSave,
    saving,
    batchSaving,
    impactModalOpen,
    setImpactModalOpen,
    impactData,
    editedRoles,
    togglePermission,
    isRoleModified,
    hasAnyModifiedRoles,
    checkRevocationAndSave,
    executeSaveRole,
    handleSaveAll,
    executeBatchSave,
    filteredGroupedPermissions,
    totalFilteredPerms,
    fetchData,
  };
}
