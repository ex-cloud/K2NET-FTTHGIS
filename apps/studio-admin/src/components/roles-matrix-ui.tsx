import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@k2net/auth/client";
import {
  type Role,
  type ImpactData,
  type RolesMatrixUIProps,
  useRolesMatrixState,
  RolesMatrixHeader,
  RolesMatrixToolbar,
  RolesMatrixTable,
  RolesMatrixGrid,
  RolesMatrixModals,
  CreateRoleModal,
} from "./roles-matrix";
import { deleteRole } from "./roles-matrix/rolesMatrixApi";

export function RolesMatrixUI({ context }: RolesMatrixUIProps) {
  const { t } = useTranslation();
  const { canAccess } = usePermissions();
  const { token } = useAuth();
  const state = useRolesMatrixState(context);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-card/20 rounded-xl border border-border">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleConfirmTemplate = async (role: Role) => {
    await state.executeSaveRole(role);
    await state.fetchData();
  };

  const handleConfirmImpact = async (data: ImpactData) => {
    if (data.isBatch) {
      await state.executeBatchSave(data.roles);
    } else if (data.roles.length > 0) {
      await state.executeSaveRole(data.roles[0]);
    }
  };

  const handleGridSaveRole = (role: Role) => {
    if (role.isSystemRole && context !== "system") {
      state.setPendingRoleToSave(role);
      state.setShowConfirmDialog(true);
    } else {
      state.checkRevocationAndSave(role);
    }
  };

  const canEdit = canAccess(["system.security.manage", "roles.update"]);

  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: Role) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleConfirmDeleteRole = async (role: Role) => {
    if (!token) return;
    setIsDeletingRole(true);
    try {
      await deleteRole(role.id, token);
      toast.success(
        t("security.role_deleted_success", {
          name: role.displayName || role.name,
        })
      );
      setRoleToDelete(null);
      await state.fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("security.failed_delete_role");
      toast.error(msg);
    } finally {
      setIsDeletingRole(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <RolesMatrixHeader
        context={context}
        selectedScope={state.selectedScope}
        setSelectedScope={state.setSelectedScope}
        viewMode={state.viewMode}
        setViewMode={state.setViewMode}
        hasAnyModifiedRoles={state.hasAnyModifiedRoles}
        batchSaving={state.batchSaving}
        canUpdateRoles={canEdit}
        handleSaveAll={state.handleSaveAll}
        onCreateRole={handleOpenCreateRole}
      />

      <RolesMatrixToolbar
        searchQuery={state.searchQuery}
        setSearchQuery={state.setSearchQuery}
        diffOnly={state.diffOnly}
        setDiffOnly={state.setDiffOnly}
        totalFilteredPerms={state.totalFilteredPerms}
        totalPerms={state.permissions.length}
      />

      {state.viewMode === "table" ? (
        <RolesMatrixTable
          roles={state.roles}
          selectedScope={state.selectedScope}
          filteredGroupedPermissions={state.filteredGroupedPermissions}
          editedRoles={state.editedRoles}
          isRoleModified={state.isRoleModified}
          togglePermission={state.togglePermission}
          canEdit={canEdit}
          onEditRole={handleOpenEditRole}
          onDeleteRole={(role) => setRoleToDelete(role)}
        />
      ) : (
        <RolesMatrixGrid
          roles={state.roles}
          selectedScope={state.selectedScope}
          filteredGroupedPermissions={state.filteredGroupedPermissions}
          editedRoles={state.editedRoles}
          saving={state.saving}
          canEdit={canEdit}
          isRoleModified={state.isRoleModified}
          togglePermission={state.togglePermission}
          onSaveRole={handleGridSaveRole}
          onEditRole={handleOpenEditRole}
          onDeleteRole={(role) => setRoleToDelete(role)}
        />
      )}

      <RolesMatrixModals
        showConfirmDialog={state.showConfirmDialog}
        setShowConfirmDialog={state.setShowConfirmDialog}
        pendingRoleToSave={state.pendingRoleToSave}
        onConfirmStandardTemplate={handleConfirmTemplate}
        impactModalOpen={state.impactModalOpen}
        setImpactModalOpen={state.setImpactModalOpen}
        impactData={state.impactData}
        onConfirmImpact={handleConfirmImpact}
        roleToDelete={roleToDelete}
        setRoleToDelete={setRoleToDelete}
        onConfirmDeleteRole={handleConfirmDeleteRole}
        isDeletingRole={isDeletingRole}
      />

      <CreateRoleModal
        open={isRoleModalOpen}
        onOpenChange={(open) => {
          setIsRoleModalOpen(open);
          if (!open) setEditingRole(null);
        }}
        defaultScope={state.selectedScope}
        editingRole={editingRole}
        token={token || undefined}
        onSuccess={() => state.fetchData()}
      />
    </div>
  );
}
