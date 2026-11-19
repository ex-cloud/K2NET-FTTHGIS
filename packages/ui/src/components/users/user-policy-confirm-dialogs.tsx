import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../dialog";
import {
  type UnifiedUserRecord,
  type UnifiedTranslateFn,
  trKey,
} from "./user-management-types";

export interface UserDiscardConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "invite" | "edit";
  t?: UnifiedTranslateFn;
  onConfirmLeave: () => void;
}

export function UserDiscardConfirmDialog({
  open,
  onOpenChange,
  variant,
  t,
  onConfirmLeave,
}: UserDiscardConfirmDialogProps) {
  const isInvite = variant === "invite";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-foreground">
            {isInvite
              ? trKey(t, "users.cf_discard_title", "Discard Invitations")
              : trKey(t, "users.cf_discard_edit_title", "Discard Changes")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isInvite
              ? trKey(
                  t,
                  "users.cf_discard_desc",
                  "If you leave now, all progress will be lost and members will not be invited."
                )
              : trKey(
                  t,
                  "users.cf_discard_edit_desc",
                  "If you leave now, all unsaved policy and profile changes will be lost."
                )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {isInvite
              ? trKey(t, "users.cf_keep_inviting_btn", "Keep inviting members")
              : trKey(t, "users.cf_keep_editing_btn", "Keep editing")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onConfirmLeave();
            }}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {trKey(t, "users.cf_leave_process_btn", "Leave process")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface UserDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UnifiedUserRecord;
  isDeleting?: boolean;
  t?: UnifiedTranslateFn;
  onConfirmDelete: () => Promise<void> | void;
}

export function UserDeleteConfirmDialog({
  open,
  onOpenChange,
  user,
  isDeleting = false,
  t,
  onConfirmDelete,
}: UserDeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-destructive">
            {trKey(
              t,
              "users.member_remove_confirm_title",
              "Remove Member from Workspace?"
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {trKey(
              t,
              "users.member_remove_confirm_desc",
              "Are you sure you want to remove {{name}} ({{email}}) from this organization workspace? Their active sessions and access to this tenant will be revoked immediately.",
              {
                name: user.fullName || user.username || user.email,
                email: user.email,
              }
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2 gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {trKey(t, "common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={async () => {
              await onConfirmDelete();
              onOpenChange(false);
            }}
            className="h-7 px-2.5 text-xs font-medium gap-1.5"
          >
            {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
            {trKey(t, "users.member_remove_btn", "Remove from Workspace")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
