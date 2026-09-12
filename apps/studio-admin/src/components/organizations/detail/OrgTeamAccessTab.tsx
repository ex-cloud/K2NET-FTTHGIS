import type { EnrichedOrganization } from "../types";
import { useOrgTeamState } from "./team/useOrgTeamState";
import { TeamHeaderBar } from "./team/TeamHeaderBar";
import { TeamMembersTable } from "./team/TeamMembersTable";
import { InviteMemberModal } from "./team/InviteMemberModal";

export type { TenantUser, TenantUserRole, TenantUserStatus } from "./team/types";

interface OrgTeamAccessTabProps {
  organization: EnrichedOrganization;
}

export function OrgTeamAccessTab({ organization: org }: OrgTeamAccessTabProps) {
  const {
    inviteOpen,
    setInviteOpen,
    inviteName,
    setInviteName,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    effectiveUsers,
    isLoading,
    handleSendInvite,
    handleCopy,
    handlePasswordReset,
    handleResendInvite,
    handleChangeRole,
    handleRemoveUser,
  } = useOrgTeamState(org);

  return (
    <div className="space-y-6">
      {/* 1. Header with Invite Action */}
      <TeamHeaderBar
        slug={org.slug}
        onOpenInvite={() => setInviteOpen(true)}
      />

      {/* 2. Team Members Table */}
      <TeamMembersTable
        users={effectiveUsers}
        isLoading={isLoading}
        onPasswordReset={handlePasswordReset}
        onResendInvite={handleResendInvite}
        onChangeRole={handleChangeRole}
        onCopy={handleCopy}
        onRemoveUser={handleRemoveUser}
      />

      {/* 3. Invite Member Dialog */}
      <InviteMemberModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        orgName={org.name}
        name={inviteName}
        setName={setInviteName}
        email={inviteEmail}
        setEmail={setInviteEmail}
        role={inviteRole}
        setRole={setInviteRole}
        onSendInvite={handleSendInvite}
      />
    </div>
  );
}
