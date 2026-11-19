import * as React from "react";
import { Search } from "lucide-react";
import {
  Input,
  UnifiedUserManagementTable,
  type UnifiedUserRecord,
  type UnifiedTranslateFn,
} from "@k2net/ui";
import { useTranslation, type TranslationKey } from "@k2net/i18n";

export interface UserProjectRole {
  projectId: string;
  projectName: string;
  roleName: string;
  roleDisplayName: string;
}

export interface UserDto extends UnifiedUserRecord {
  timezone?: string;
  permissions?: string[];
}

interface TeamMembersTableSectionProps {
  isLoading: boolean;
  filteredMembers: UserDto[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  canManageMembers: boolean;
  canInviteUsers?: boolean;
  resendingMemberId?: string | null;
  onEditMember: (member: UserDto) => void;
  onResetPassword?: (member: UserDto) => void;
  onToggleStatus?: (member: UserDto) => void;
  onCopyEmail: (email: string) => void;
  onResendVerification?: (member: UserDto) => void;
  onRemoveMember: (member: UserDto) => void;
}

export function TeamMembersTableSection({
  isLoading,
  filteredMembers,
  searchQuery,
  onSearchQueryChange,
  canManageMembers,
  canInviteUsers = false,
  resendingMemberId,
  onEditMember,
  onResetPassword,
  onToggleStatus,
  onCopyEmail,
  onResendVerification,
  onRemoveMember,
}: TeamMembersTableSectionProps) {
  const { t, formatDate } = useTranslation();

  const translate: UnifiedTranslateFn = React.useCallback(
    (key, params) => t(key as TranslationKey, params as Record<string, string>),
    [t]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t("users.filter_placeholder")}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="h-7.5 pl-8 text-xs bg-muted/20 border-border/80"
          />
        </div>
      </div>

      <UnifiedUserManagementTable
        scope="tenant"
        users={filteredMembers}
        isLoading={isLoading}
        canManageUsers={canManageMembers}
        canInviteUsers={canInviteUsers}
        resendingUserId={resendingMemberId}
        t={translate}
        formatDate={formatDate}
        onEditUser={(u) => onEditMember(u as UserDto)}
        onResetPassword={
          onResetPassword ? (u) => onResetPassword(u as UserDto) : undefined
        }
        onToggleStatus={
          onToggleStatus ? (u) => onToggleStatus(u as UserDto) : undefined
        }
        onResendVerification={
          onResendVerification
            ? (u) => onResendVerification(u as UserDto)
            : undefined
        }
        onCopyEmail={onCopyEmail}
        onCopyUserId={onCopyEmail}
        onRemoveUser={(u) => onRemoveMember(u as UserDto)}
      />
    </div>
  );
}
