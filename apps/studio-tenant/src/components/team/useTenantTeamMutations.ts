import type { QueryClient } from "@tanstack/react-query";
import type { UnifiedTranslateFn } from "@k2net/ui";
import type { EditableTenantRole } from "./TenantRoleBuilderDialog";
import type { UserDto } from "./TeamMembersTableSection";
import { useTenantMemberMutations } from "./useTenantMemberMutations";
import { useTenantRoleMutations } from "./useTenantRoleMutations";

export interface UseTenantTeamMutationsArgs {
  orgSlug: string;
  t: UnifiedTranslateFn;
  queryClient: QueryClient;
  removingMember: UserDto | null;
  setRemovingMember: (m: UserDto | null) => void;
  setIsRemovingMember: (v: boolean) => void;
  deletingRole: EditableTenantRole | null;
  setDeletingRole: (r: EditableTenantRole | null) => void;
  setIsDeletingRole: (v: boolean) => void;
  setResendingMemberId: (id: string | null) => void;
  setIsSubmittingInvite: (v: boolean) => void;
  setIsSavingEdit: (v: boolean) => void;
  setIsResettingPassword: (v: boolean) => void;
  setMemberViewMode: (mode: "list" | "invite" | "edit") => void;
  setSelectedMember: (m: UserDto | null) => void;
}

export function useTenantTeamMutations({
  orgSlug,
  t,
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
}: UseTenantTeamMutationsArgs) {
  const memberMutations = useTenantMemberMutations({
    orgSlug,
    t,
    queryClient,
    removingMember,
    setRemovingMember,
    setIsRemovingMember,
    setResendingMemberId,
    setIsSubmittingInvite,
    setIsSavingEdit,
    setMemberViewMode,
    setSelectedMember,
  });

  const roleMutations = useTenantRoleMutations({
    t,
    queryClient,
    deletingRole,
    setDeletingRole,
    setIsDeletingRole,
    setIsResettingPassword,
  });

  return {
    ...memberMutations,
    ...roleMutations,
  };
}
