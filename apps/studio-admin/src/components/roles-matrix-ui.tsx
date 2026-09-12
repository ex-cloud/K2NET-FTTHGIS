import { Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
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
} from "./roles-matrix";

export function RolesMatrixUI({ context }: RolesMatrixUIProps) {
  const { canAccess } = usePermissions();
  const state = useRolesMatrixState(context);

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
    </div>
  );
}
