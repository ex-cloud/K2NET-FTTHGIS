import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { UnifiedTranslateFn } from "@k2net/ui";
import { useTranslation, type TranslationKey } from "@k2net/i18n";
import { getCurrentOrgSlug } from "../../lib/domain";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { usePermissions } from "../../hooks/use-permissions";
import type { EditableTenantRole } from "./TenantRoleBuilderDialog";
import type { UserDto } from "./TeamMembersTableSection";
import { useTenantTeamMutations } from "./useTenantTeamMutations";
import { useTenantTeamData } from "./useTenantTeamData";

export function useTenantTeamPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const orgSlug = getCurrentOrgSlug() || "system";
  const { tier } = useTenantSubscription();
  const { canAccess } = usePermissions();

  const translate: UnifiedTranslateFn = React.useCallback(
    (key, params) => t(key as TranslationKey, params as Record<string, string>),
    [t]
  );

  const canInviteUsers = canAccess([
    "members.invite",
    "team.invite",
    "users.invite",
    "team.manage",
  ]);
  const canManageMembers = canAccess([
    "members.manage",
    "team.manage",
    "users.manage",
  ]);
  const canManageRoles = canAccess([
    "roles.manage",
    "roles.update",
    "team.manage",
  ]);

  const [memberViewMode, setMemberViewMode] = React.useState<
    "list" | "invite" | "edit"
  >("list");
  const [selectedMember, setSelectedMember] = React.useState<UserDto | null>(
    null
  );
  const [focusPasswordReset, setFocusPasswordReset] = React.useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = React.useState(false);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);

  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
  const [removingMember, setRemovingMember] = React.useState<UserDto | null>(
    null
  );
  const [isRemovingMember, setIsRemovingMember] = React.useState(false);
  const [roleBuilderOpen, setRoleBuilderOpen] = React.useState(false);
  const [editingRole, setEditingRole] =
    React.useState<EditableTenantRole | null>(null);
  const [deletingRole, setDeletingRole] =
    React.useState<EditableTenantRole | null>(null);
  const [isDeletingRole, setIsDeletingRole] = React.useState(false);
  const [resendingMemberId, setResendingMemberId] = React.useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const subView = React.useMemo(() => {
    if (pathname.includes("/team/roles")) return "roles";
    if (pathname.includes("/team/activity")) return "activity";
    return "members";
  }, [pathname]);

  React.useEffect(() => {
    setMemberViewMode("list");
    setSelectedMember(null);
    setFocusPasswordReset(false);
  }, [subView]);

  const {
    members,
    isLoading,
    isLoadingRoles,
    tenantProjects,
    unifiedRoleOptions,
    rolesList,
  } = useTenantTeamData({ orgSlug, subView, t: translate });

  const filteredMembers = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return members.filter((m) => {
      const nameMatch = (m.fullName || m.username || "")
        .toLowerCase()
        .includes(q);
      const emailMatch = (m.email || "").toLowerCase().includes(q);
      return nameMatch || emailMatch;
    });
  }, [members, searchQuery]);

  const maxMembers = tier === "free" ? 1 : tier === "pro" ? 10 : 100;

  const handleOpenInvite = () => {
    if (members.length >= maxMembers) {
      setUpgradeModalOpen(true);
      return;
    }
    setMemberViewMode("invite");
  };

  const mutations = useTenantTeamMutations({
    orgSlug,
    t: translate,
    queryClient,
    removingMember,
    setRemovingMember,
    setIsRemovingMember,
    deletingRole,
    setDeletingRole,
    setIsDeletingRole,
    setResendingMemberId,
    setIsSubmittingInvite,
    setIsSavingEdit,
    setIsResettingPassword,
    setMemberViewMode,
    setSelectedMember,
  });

  return {
    t,
    translate,
    queryClient,
    orgSlug,
    subView,
    canInviteUsers,
    canManageMembers,
    canManageRoles,
    memberViewMode,
    setMemberViewMode,
    selectedMember,
    setSelectedMember,
    focusPasswordReset,
    setFocusPasswordReset,
    isSubmittingInvite,
    isSavingEdit,
    isResettingPassword,
    upgradeModalOpen,
    setUpgradeModalOpen,
    removingMember,
    setRemovingMember,
    isRemovingMember,
    roleBuilderOpen,
    setRoleBuilderOpen,
    editingRole,
    setEditingRole,
    deletingRole,
    setDeletingRole,
    isDeletingRole,
    resendingMemberId,
    searchQuery,
    setSearchQuery,
    isLoading,
    members,
    filteredMembers,
    maxMembers,
    isLoadingRoles,
    tenantProjects,
    unifiedRoleOptions,
    rolesList,
    handleOpenInvite,
    ...mutations,
  };
}
