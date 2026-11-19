import * as React from "react";
import {
  ShieldCheck,
  Mail,
  Loader2,
  Phone,
  Pencil,
  CheckCircle2,
  Clock,
  Send,
  MoreVertical,
  Building2,
  FolderGit2,
} from "lucide-react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import { TableRow, TableCell } from "../table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "../dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from "../context-menu";
import { cn } from "../../utils";
import {
  type UnifiedUserRecord,
  type UnifiedUserScope,
  type UnifiedTranslateFn,
  trKey,
  resolveCanonicalRoleCode,
} from "./user-management-types";
import { resolveStatusConfig, formatDateTimeSafe } from "./user-table-helpers";
import { UserTableRowMenuActions } from "./user-table-row-actions";

export interface UnifiedUserTableRowProps {
  scope: UnifiedUserScope;
  user: UnifiedUserRecord;
  canManageUsers: boolean;
  canInviteUsers: boolean;
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
}

export function UnifiedUserTableRow({
  scope,
  user,
  canManageUsers,
  canInviteUsers,
  resendingUserId,
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
}: UnifiedUserTableRowProps) {
  const statusUpper = (user.status || "ACTIVE").toUpperCase();
  const isEmailVerified =
    typeof user.emailVerified === "boolean"
      ? user.emailVerified
      : statusUpper === "ACTIVE";
  const isResending = resendingUserId === user.id;
  const canResend =
    !isEmailVerified &&
    (canManageUsers || canInviteUsers) &&
    Boolean(onResendVerification);
  const statusBadge = resolveStatusConfig(statusUpper, user.status, t);
  const roleCode = resolveCanonicalRoleCode(user.roleName, user.roleCode, scope);
  const displayUsername =
    user.username || (user.email ? user.email.split("@")[0] : "user");
  const formattedLastLogin = formatDateTimeSafe(
    user.lastLoginAt || user.lastLogin,
    formatDate
  );
  const formattedCreated = formatDateTimeSafe(user.createdAt, formatDate);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow
          onClick={() => canManageUsers && onEditUser?.(user)}
          className={cn(
            "border-b border-border/50 text-xs hover:bg-muted/30 transition-colors",
            canManageUsers && onEditUser && "cursor-pointer"
          )}
        >
          {/* 1. USER: Avatar + Full Name + Job Title + @username */}
          <TableCell className="px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-7 rounded-full border border-border shrink-0">
                <AvatarImage src={user.avatarUrl} alt={user.fullName || "User"} />
                <AvatarFallback className="rounded-full text-[10px] font-bold">
                  {(user.fullName || user.username || user.email || "U")
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground truncate">
                    {user.fullName || user.username || user.email}
                  </span>
                  {user.jobTitle && user.jobTitle.trim().length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 font-normal bg-muted/40 text-muted-foreground border-border/80"
                    >
                      {user.jobTitle}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground block truncate">
                  @{displayUsername}
                </span>
              </div>
            </div>
          </TableCell>

          {/* 2. ROLE: Role Display Name + [CODE] */}
          <TableCell className="px-3 py-2.5">
            <Badge
              variant="outline"
              className="font-mono text-[10px] gap-1 bg-muted/30 border-border text-foreground"
            >
              <span>
                {user.roleDisplayName ||
                  (user.roleName
                    ? user.roleName.replace(/_/g, " ").toUpperCase()
                    : trKey(t, "users.role_viewer", "Viewer"))}
              </span>
              {roleCode && (
                <span className="text-muted-foreground text-[9px]">[{roleCode}]</span>
              )}
            </Badge>
          </TableCell>

          {/* 3. EMAIL & CONTACT: Email + WhatsApp + Verified/Unverified + Resend Verification */}
          <TableCell className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-1 font-mono text-[11px] text-foreground">
                  <Mail className="size-3 text-muted-foreground shrink-0" />
                  {user.email}
                </span>
                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0 rounded-full border bg-primary/10 text-primary border-primary/20">
                    <CheckCircle2 className="size-2.5" />
                    {trKey(t, "users.email_verified", "Verified")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0 rounded-full border bg-muted/60 text-muted-foreground border-border">
                    <Clock className="size-2.5" />
                    {trKey(t, "users.email_unverified", "Unverified")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {user.phone && user.phone !== "—" && (
                  <a
                    href={`https://wa.me/${user.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:underline"
                  >
                    <Phone className="size-2.5 shrink-0" />
                    {user.phone}
                  </a>
                )}

                {canResend && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isResending}
                    onClick={() => onResendVerification?.(user)}
                    className="h-6 px-2 text-[11px] font-medium gap-1"
                  >
                    {isResending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3" />
                    )}
                    {trKey(t, "users.ctx_resend_verification", "Resend Verification")}
                  </Button>
                )}
              </div>
            </div>
          </TableCell>

          {/* 4. MFA / 2FA */}
          <TableCell className="px-3 py-2.5">
            {user.mfaEnabled ? (
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1"
              >
                <ShieldCheck className="size-3" />
                <span>{trKey(t, "users.mfa_enabled", "Enabled")}</span>
              </Badge>
            ) : (
              <span className="text-muted-foreground text-[10px] font-mono">
                {trKey(t, "users.mfa_disabled", "Disabled")}
              </span>
            )}
          </TableCell>

          {/* 5. SCOPE (WORKSPACES or PROJECTS) */}
          <TableCell className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
            {scope === "platform" ? (
              renderWorkspaceCell ? (
                renderWorkspaceCell(user)
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3.5 shrink-0" />
                  <span>
                    {user.organizationName ||
                      trKey(t, "users.workspace_system", "System")}
                  </span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <FolderGit2 className="size-3.5 text-muted-foreground shrink-0" />
                <span className="font-semibold text-foreground">
                  {user.projectRoles && user.projectRoles.length > 0
                    ? trKey(t, "users.projects_count", "{{count}} Projects", {
                        count: user.projectRoles.length,
                      })
                    : trKey(t, "users.projects_all", "All Projects")}
                </span>
              </div>
            )}
          </TableCell>

          {/* 6. STATUS */}
          <TableCell className="px-3 py-2.5">
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[10px] px-2 py-0.5 rounded-full",
                statusBadge.className
              )}
            >
              {statusBadge.label}
            </Badge>
          </TableCell>

          {/* 7. LAST LOGIN & IP */}
          <TableCell className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
            <div className="space-y-0.5">
              <span className="block text-foreground/90">
                {formattedLastLogin ||
                  formattedCreated ||
                  trKey(t, "users.last_login_never", "Never")}
              </span>
              {user.lastLoginIp && (
                <span className="text-[10px] text-muted-foreground block">
                  {trKey(t, "users.ip_prefix", "IP:")} {user.lastLoginIp}
                </span>
              )}
            </div>
          </TableCell>

          {/* 8. ACTIONS */}
          <TableCell
            className="px-4 py-2.5 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end items-center gap-1">
              {canManageUsers && onEditUser && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => onEditUser(user)}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                >
                  <Pencil className="size-3" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 text-xs">
                  <UserTableRowMenuActions
                    user={user}
                    canManageUsers={canManageUsers}
                    canResend={canResend}
                    isResending={isResending}
                    t={t}
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
                    mode="dropdown"
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-60 text-xs">
        <UserTableRowMenuActions
          user={user}
          canManageUsers={canManageUsers}
          canResend={canResend}
          isResending={isResending}
          t={t}
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
          mode="context"
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}
