import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  const { canAccess } = usePermissions();
  const { token } = useAuth();
  const state = useRolesMatrixState(context);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);

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

  const canEdit = canAccess("roles.update");

  const handleDeleteRole = async (role: Role) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to permanently delete custom role "${role.displayName || role.name}"?`)) {
      return;
    }
    try {
      await deleteRole(role.id, token);
      toast.success(`Role "${role.displayName || role.name}" deleted successfully!`);
      await state.fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete role");
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
        onCreateRole={() => setIsCreateRoleOpen(true)}
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
          onDeleteRole={handleDeleteRole}
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
      />

      <CreateRoleModal
        open={isCreateRoleOpen}
        onOpenChange={setIsCreateRoleOpen}
        defaultScope={state.selectedScope}
        token={token || undefined}
        onSuccess={() => state.fetchData()}
      />
    </div>
  );
}
