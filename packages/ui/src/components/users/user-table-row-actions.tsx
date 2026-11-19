import * as React from "react";
import {
  ShieldAlert,
  History,
  KeyRound,
  Copy,
  Trash2,
  Loader2,
  Pencil,
  Send,
  FileCode,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../dropdown-menu";
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "../context-menu";
import {
  type UnifiedUserRecord,
  type UnifiedTranslateFn,
  trKey,
} from "./user-management-types";

export interface UserTableRowMenuActionsProps {
  user: UnifiedUserRecord;
  canManageUsers: boolean;
  canResend: boolean;
  isResending: boolean;
  t?: UnifiedTranslateFn;
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
  mode: "dropdown" | "context";
}

export function UserTableRowMenuActions({
  user,
  canManageUsers,
  canResend,
  isResending,
  t,
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
  mode,
}: UserTableRowMenuActionsProps) {
  const Item = mode === "dropdown" ? DropdownMenuItem : ContextMenuItem;
  const Sep = mode === "dropdown" ? DropdownMenuSeparator : ContextMenuSeparator;
  const isSuspended = (user.status || "").toUpperCase() === "SUSPENDED";

  return (
    <>
      {onAskAi && (
        <Item onClick={() => onAskAi(user)} className="gap-2 cursor-pointer text-xs">
          <Sparkles className="size-3.5 text-primary" />
          <span>{trKey(t, "users.ctx_ask_ai", "Ask AI about User")}</span>
        </Item>
      )}

      {canResend && onResendVerification && (
        <Item
          onClick={() => onResendVerification(user)}
          disabled={isResending}
          className="gap-2 cursor-pointer text-xs text-primary"
        >
          {isResending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          <span>{trKey(t, "users.ctx_resend_verification", "Resend Verification")}</span>
        </Item>
      )}

      {canManageUsers && onEditUser && (
        <Item onClick={() => onEditUser(user)} className="gap-2 cursor-pointer text-xs">
          <Pencil className="size-3.5" />
          <span>{trKey(t, "users.ctx_edit_profile", "Edit Profile & Role")}</span>
        </Item>
      )}

      {canManageUsers && onResetPassword && (
        <Item onClick={() => onResetPassword(user)} className="gap-2 cursor-pointer text-xs">
          <KeyRound className="size-3.5" />
          <span>{trKey(t, "users.ctx_reset_password", "Reset Password")}</span>
        </Item>
      )}

      {canManageUsers && onToggleStatus && (
        <Item onClick={() => onToggleStatus(user)} className="gap-2 cursor-pointer text-xs">
          <ShieldAlert className="size-3.5" />
          <span>
            {isSuspended
              ? trKey(t, "users.ctx_activate_account", "Activate Account")
              : trKey(t, "users.ctx_suspend_account", "Suspend Account")}
          </span>
        </Item>
      )}

      <Sep />

      {onCopyEmail && (
        <Item onClick={() => onCopyEmail(user.email)} className="gap-2 cursor-pointer text-xs">
          <Copy className="size-3.5" />
          <span>{trKey(t, "users.ctx_copy_email", "Copy Email")}</span>
        </Item>
      )}

      {onCopyUserId && (
        <Item onClick={() => onCopyUserId(user.id)} className="gap-2 cursor-pointer text-xs">
          <FileCode className="size-3.5" />
          <span>{trKey(t, "users.ctx_copy_user_id", "Copy User ID")}</span>
        </Item>
      )}

      {onViewAudit && (
        <Item onClick={() => onViewAudit(user)} className="gap-2 cursor-pointer text-xs">
          <History className="size-3.5" />
          <span>{trKey(t, "users.ctx_view_audit", "View Audit Log")}</span>
        </Item>
      )}

      {canManageUsers && (onRevokeSession || onRemoveUser) && <Sep />}

      {canManageUsers && onRevokeSession && (
        <Item
          onClick={() => onRevokeSession(user)}
          className="gap-2 cursor-pointer text-xs text-destructive"
        >
          <ShieldAlert className="size-3.5" />
          <span>{trKey(t, "users.ctx_revoke_session", "Revoke Keycloak Session")}</span>
        </Item>
      )}

      {canManageUsers && onRemoveUser && (
        <Item
          onClick={() => onRemoveUser(user)}
          className="gap-2 cursor-pointer text-xs text-destructive"
        >
          <Trash2 className="size-3.5" />
          <span>{trKey(t, "users.ctx_remove_member", "Remove from Workspace")}</span>
        </Item>
      )}
    </>
  );
}
