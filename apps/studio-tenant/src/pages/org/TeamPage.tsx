import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Shield, Users, Activity } from "lucide-react";
import {
  PageHero,
  PageLayout,
  Button,
  UnifiedUserInvitePanel,
  UnifiedUserEditPolicyPanel,
} from "@k2net/ui";
import { TenantRoleBuilderDialog } from "../../components/team/TenantRoleBuilderDialog";
import {
  TeamRolesGrid,
  TeamConfirmDialogs,
} from "../../components/team/TeamRolesAndDialogs";
import {
  TeamMembersTableSection,
  type UserDto,
} from "../../components/team/TeamMembersTableSection";
import { useTenantTeamPage } from "../../components/team/useTenantTeamPage";
import { TenantAuditExplorer } from "../../components/audit";
import { TenantFeatureUpgradeModal } from "../../components/system/TenantFeatureUpgradeModal";

export function TeamPage() {
  const navigate = useNavigate();
  const state = useTenantTeamPage();
  const { t, translate, orgSlug, subView, memberViewMode, selectedMember } = state;

  const heroTitle =
    subView === "roles"
      ? t("security.roles_matrix")
      : subView === "activity"
      ? t("security.audit_trail_title")
      : t("users.title");

  const heroSubtitle =
    subView === "roles"
      ? t("security.roles_matrix_subtitle")
      : subView === "activity"
      ? t("security.audit_trail_desc")
      : t("users.manage_team_subtitle");

  const scopeAccountName = `${orgSlug.toUpperCase()} Workspace (${orgSlug}.kdua.net)`;

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow={t("nav.team_members")}
        title={heroTitle}
        icon={
          subView === "roles"
            ? Shield
            : subView === "activity"
            ? Activity
            : Users
        }
        subtitle={heroSubtitle}
        meta={
          subView === "members" ? (
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>{t("users.active_now")}:</span>
              <strong className="text-foreground">
                {state.members.length}/{state.maxMembers}
              </strong>
            </div>
          ) : undefined
        }
        actions={
          subView === "members" &&
          memberViewMode === "list" &&
          state.canInviteUsers ? (
            <Button
              size="sm"
              onClick={state.handleOpenInvite}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs"
            >
              <Plus className="size-3.5" />
              {t("users.add_user_button")}
            </Button>
          ) : subView === "roles" && state.canManageRoles ? (
            <Button
              size="sm"
              onClick={() => {
                state.setEditingRole(null);
                state.setRoleBuilderOpen(true);
              }}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs"
            >
              <Plus className="size-3.5" />
              {t("security.new_role_btn")}
            </Button>
          ) : undefined
        }
      />

      <div className="w-full space-y-4">
        {subView === "members" && memberViewMode === "list" && (
          <TeamMembersTableSection
            isLoading={state.isLoading}
            filteredMembers={state.filteredMembers}
            searchQuery={state.searchQuery}
            onSearchQueryChange={state.setSearchQuery}
            canManageMembers={state.canManageMembers}
            canInviteUsers={state.canInviteUsers}
            resendingMemberId={state.resendingMemberId}
            onEditMember={(member) => {
              state.setSelectedMember(member);
              state.setFocusPasswordReset(false);
              state.setMemberViewMode("edit");
            }}
            onResetPassword={(member) => {
              state.setSelectedMember(member);
              state.setFocusPasswordReset(true);
              state.setMemberViewMode("edit");
            }}
            onToggleStatus={state.handleToggleStatus}
            onCopyEmail={state.handleCopyEmail}
            onResendVerification={state.handleResendVerification}
            onRemoveMember={(member) => state.setRemovingMember(member)}
          />
        )}

        {subView === "members" && memberViewMode === "invite" && (
          <UnifiedUserInvitePanel
            scope="tenant"
            scopeAccountName={scopeAccountName}
            roles={state.unifiedRoleOptions}
            projects={state.tenantProjects}
            isSubmitting={state.isSubmittingInvite}
            t={translate}
            onCancel={() => state.setMemberViewMode("list")}
            onSubmit={state.handleInviteSubmit}
          />
        )}

        {subView === "members" &&
          memberViewMode === "edit" &&
          selectedMember && (
            <UnifiedUserEditPolicyPanel
              scope="tenant"
              scopeAccountName={scopeAccountName}
              user={selectedMember}
              roles={state.unifiedRoleOptions}
              projects={state.tenantProjects}
              isSaving={state.isSavingEdit}
              isDeleting={state.isRemovingMember}
              isResendingVerification={
                state.resendingMemberId === selectedMember.id
              }
              isResettingPassword={state.isResettingPassword}
              initialShowPasswordReset={state.focusPasswordReset}
              t={translate}
              onCancel={() => {
                state.setMemberViewMode("list");
                state.setSelectedMember(null);
                state.setFocusPasswordReset(false);
              }}
              onSave={state.handleSaveEdit}
              onDelete={(u) => state.handleDeleteFromEditPanel(u.id)}
              onResendVerification={(u) =>
                state.handleResendVerification(u as UserDto)
              }
              onResetPassword={state.handleResetPassword}
            />
          )}

        {subView === "roles" && (
          <TeamRolesGrid
            isLoading={state.isLoadingRoles}
            rolesList={state.rolesList}
            canManageRoles={state.canManageRoles}
            onEditRole={(role) => {
              state.setEditingRole(role);
              state.setRoleBuilderOpen(true);
            }}
            onDeleteRole={(role) => state.setDeletingRole(role)}
          />
        )}

        {subView === "activity" && (
          <TenantAuditExplorer
            scope="ORGANIZATION"
            initialCategory="IAM"
            title={t("security.audit_trail_title")}
            description={t("security.audit_trail_desc")}
          />
        )}
      </div>

      <TenantRoleBuilderDialog
        open={state.roleBuilderOpen}
        onOpenChange={state.setRoleBuilderOpen}
        editingRole={state.editingRole}
        onSuccess={() => {
          state.queryClient.invalidateQueries({
            queryKey: ["tenant-roles-catalog", orgSlug],
          });
          state.queryClient.invalidateQueries({
            queryKey: ["tenant-team-members", orgSlug],
          });
        }}
      />

      <TeamConfirmDialogs
        removingMember={state.removingMember}
        onCloseRemoveMember={() => state.setRemovingMember(null)}
        onConfirmRemoveMember={state.handleConfirmRemoveMember}
        isRemovingMember={state.isRemovingMember}
        deletingRole={state.deletingRole}
        onCloseDeleteRole={() => state.setDeletingRole(null)}
        onConfirmDeleteRole={state.handleConfirmDeleteRole}
        isDeletingRole={state.isDeletingRole}
      />

      <TenantFeatureUpgradeModal
        open={state.upgradeModalOpen}
        onOpenChange={state.setUpgradeModalOpen}
        featureName={t("users.total_users")}
        featureDescription={t("billing.upgrade_prompt")}
        onUpgradeClick={() => navigate({ to: "/billing" })}
      />
    </PageLayout>
  );
}
