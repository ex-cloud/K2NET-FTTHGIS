import * as React from "react";
import { Users, Loader2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../table";
import {
  type UnifiedUserRecord,
  type UnifiedUserScope,
  type UnifiedTranslateFn,
  trKey,
} from "./user-management-types";
import { UnifiedUserTableRow } from "./user-table-row";

export interface UnifiedUserManagementTableProps {
  scope: UnifiedUserScope;
  users: UnifiedUserRecord[];
  isLoading?: boolean;
  canManageUsers?: boolean;
  canInviteUsers?: boolean;
  resendingUserId?: string | null;
  t?: UnifiedTranslateFn;
  formatDate?: (date: Date) => string;
  renderWorkspaceCell?: (user: UnifiedUserRecord) => React.ReactNode;
  onEditUser?: (user: UnifiedUserRecord) => void;
  onResendVerification?: (user: UnifiedUserRecord) => void;
  onResetPassword?: (user: UnifiedUserRecord) => void;
  onToggleStatus?: (user: UnifiedUserRecord) => void;
  onRevokeSession?: (user: UnifiedUserRecord) => void;
  onViewAudit?: (user: UnifiedUserRecord) => void;
  onCopyEmail?: (email: string) => void;
  onCopyUserId?: (id: string) => void;
  onAskAi?: (user: UnifiedUserRecord) => void;
  onRemoveUser?: (user: UnifiedUserRecord) => void;
  footerPagination?: React.ReactNode;
}

export function UnifiedUserManagementTable({
  scope,
  users,
  isLoading = false,
  canManageUsers = false,
  canInviteUsers = false,
  resendingUserId = null,
  t,
  formatDate,
  renderWorkspaceCell,
  onEditUser,
  onResendVerification,
  onResetPassword,
  onToggleStatus,
  onRevokeSession,
  onViewAudit,
  onCopyEmail,
  onCopyUserId,
  onAskAi,
  onRemoveUser,
  footerPagination,
}: UnifiedUserManagementTableProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {trKey(t, "users.col_user", "User")}
              </TableHead>
              <TableHead className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {trKey(t, "users.col_role", "Role")}
              </TableHead>
              <TableHead className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {trKey(t, "users.col_email_contact", "Email & Contact")}
              </TableHead>
              <TableHead className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {trKey(t, "users.col_mfa", "MFA / 2FA")}
              </TableHead>
              <TableHead className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {scope === "platform"
                  ? trKey(t, "users.col_workspaces", "Workspaces")
                  : trKey(t, "users.col_projects", "Projects")}
              </TableHead>
              <TableHead className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {trKey(t, "users.col_status", "Status")}
              </TableHead>
              <TableHead className="h-9 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {trKey(t, "users.col_last_login", "Last Login & IP")}
              </TableHead>
              <TableHead className="h-9 px-4 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {trKey(t, "users.col_actions", "Actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-36 text-center text-muted-foreground text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span>{trKey(t, "common.loading", "Loading...")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-36 text-center text-muted-foreground text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="size-7 text-muted-foreground/50" />
                    <span className="font-semibold text-foreground">
                      {trKey(t, "users.no_users_found", "No users found matching current criteria.")}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <UnifiedUserTableRow
                  key={user.id}
                  scope={scope}
                  user={user}
                  canManageUsers={canManageUsers}
                  canInviteUsers={canInviteUsers}
                  resendingUserId={resendingUserId}
                  t={t}
                  formatDate={formatDate}
                  renderWorkspaceCell={renderWorkspaceCell}
                  onEditUser={onEditUser}
                  onResendVerification={onResendVerification}
                  onResetPassword={onResetPassword}
                  onToggleStatus={onToggleStatus}
                  onRevokeSession={onRevokeSession}
                  onViewAudit={onViewAudit}
                  onCopyEmail={onCopyEmail}
                  onCopyUserId={onCopyUserId}
                  onAskAi={onAskAi}
                  onRemoveUser={onRemoveUser}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {footerPagination}
    </div>
  );
}
