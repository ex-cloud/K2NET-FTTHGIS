import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { EnrichedOrganization } from "../types";
import { useOrgTeamState } from "./team/useOrgTeamState";
import { TeamHeaderBar } from "./team/TeamHeaderBar";
import { TeamMembersTable } from "./team/TeamMembersTable";
import { InviteMemberModal } from "./team/InviteMemberModal";
import { EditMemberDialog } from "./team/EditMemberDialog";
import { ResetPasswordDialog } from "@/components/dashboard/users/reset-password-dialog";
import { useSession } from "@/lib/auth-compat";
import type { User } from "@/types/user";
import type { TenantUser } from "./team/types";

export type { TenantUser, TenantUserRole, TenantUserStatus } from "./team/types";

interface OrgTeamAccessTabProps {
  organization: EnrichedOrganization;
}

export function OrgTeamAccessTab({ organization: org }: OrgTeamAccessTabProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<TenantUser | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const {
    inviteOpen,
    setInviteOpen,
    inviteName,
    setInviteName,
    inviteEmail,
    setInviteEmail,
    invitePhone,
    setInvitePhone,
    inviteJobTitle,
    setInviteJobTitle,
    inviteRole,
    setInviteRole,
    creationMode,
    setCreationMode,
    customPassword,
    setCustomPassword,
    selectedProjectId,
    setSelectedProjectId,
    orgProjects,
    isSubmitting,
    effectiveUsers,
    isLoading,
    handleSendInvite,
    handleCopy,
    handleResendInvite,
    handleChangeRole,
    handleToggleStatus,
    handleRemoveUser,
  } = useOrgTeamState(org);

  return (
    <div className="space-y-6">
      {/* 1. Header with Invite Action */}
      <TeamHeaderBar
        slug={org.slug}
        onOpenInvite={() => setInviteOpen(true)}
      />

      {/* 2. Team Members Table with Explicit Row Actions */}
      <TeamMembersTable
        users={effectiveUsers}
        isLoading={isLoading}
        mfaEnforced={org.mfaEnforced}
        onEditMember={(tu) => {
          setSelectedUserForEdit(tu);
          setIsEditOpen(true);
        }}
        onPasswordReset={(tu) => {
          setSelectedUserForReset({
            id: tu.id,
            email: tu.email,
            fullName: tu.name,
            username: tu.username,
            status: tu.status,
            roleName: tu.role,
            roleDisplayName: tu.role,
            organizationId: org.id,
            organizationName: org.name,
            organizationSlug: org.slug,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setIsResetOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
        onViewAudit={(tu) => {
          window.location.assign(`/security/audit?user=${encodeURIComponent(tu.email)}`);
        }}
        onResendInvite={handleResendInvite}
        onChangeRole={handleChangeRole}
        onCopy={handleCopy}
        onRemoveUser={handleRemoveUser}
      />

      {/* 3. Real Reset Password Dialog */}
      {selectedUserForReset && (
        <ResetPasswordDialog
          user={selectedUserForReset}
          open={isResetOpen}
          onOpenChange={setIsResetOpen}
          token={session?.accessToken || undefined}
        />
      )}

      {/* 4. Complete Tenant Invite Modal (Rich Operational ISP Fields) */}
      <InviteMemberModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        orgName={org.name}
        name={inviteName}
        setName={setInviteName}
        email={inviteEmail}
        setEmail={setInviteEmail}
        phone={invitePhone}
        setPhone={setInvitePhone}
        jobTitle={inviteJobTitle}
        setJobTitle={setInviteJobTitle}
        role={inviteRole}
        setRole={setInviteRole}
        creationMode={creationMode}
        setCreationMode={setCreationMode}
        customPassword={customPassword}
        setCustomPassword={setCustomPassword}
        projects={orgProjects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        isSubmitting={isSubmitting}
        onSendInvite={handleSendInvite}
      />

      {/* 5. Edit Member Dialog (Role, Job Title, Phone, Status) */}
      <EditMemberDialog
        user={selectedUserForEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        token={session?.accessToken || undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["tenant-team-users", org.slug] });
        }}
      />
    </div>
  );
}
