import * as React from "react";
import {
  Pencil,
  Loader2,
  KeyRound,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../button";
import { Badge } from "../badge";
import { PermissionPoliciesAccordion } from "./permission-policies-accordion";
import { UserEditIdentitySection } from "./user-edit-identity-section";
import {
  UserDiscardConfirmDialog,
  UserDeleteConfirmDialog,
} from "./user-policy-confirm-dialogs";
import {
  type UnifiedUserRecord,
  type UnifiedRoleOption,
  type UnifiedProjectOption,
  type UnifiedUserScope,
  type UnifiedTranslateFn,
  type UnifiedEditSubmitPayload,
  type UnifiedResetPasswordPayload,
  trKey,
  generateStrongCryptoPassword,
  resolveCanonicalRoleCode,
  buildPermissionCategoriesForRole,
} from "./user-management-types";

export interface UnifiedUserEditPolicyPanelProps {
  scope: UnifiedUserScope;
  scopeAccountName: string;
  user: UnifiedUserRecord;
  roles: UnifiedRoleOption[];
  projects?: UnifiedProjectOption[];
  isSaving?: boolean;
  isDeleting?: boolean;
  isResendingVerification?: boolean;
  isResettingPassword?: boolean;
  initialShowPasswordReset?: boolean;
  t?: UnifiedTranslateFn;
  onCancel: () => void;
  onSave: (payload: UnifiedEditSubmitPayload) => Promise<void> | void;
  onDelete?: (user: UnifiedUserRecord) => Promise<void> | void;
  onResendVerification?: (user: UnifiedUserRecord) => Promise<void> | void;
  onResetPassword?: (payload: UnifiedResetPasswordPayload) => Promise<void> | void;
}

export function UnifiedUserEditPolicyPanel({
  scope,
  scopeAccountName,
  user,
  roles,
  projects = [],
  isSaving = false,
  isDeleting = false,
  isResendingVerification = false,
  isResettingPassword = false,
  initialShowPasswordReset = false,
  t,
  onCancel,
  onSave,
  onDelete,
  onResendVerification,
  onResetPassword,
}: UnifiedUserEditPolicyPanelProps) {
  const [fullName, setFullName] = React.useState(user.fullName || user.username || "");
  const [phone, setPhone] = React.useState(
    user.phone && user.phone !== "—" ? user.phone : ""
  );
  const [jobTitle, setJobTitle] = React.useState(user.jobTitle || "");
  const [status, setStatus] = React.useState(
    (user.status || "ACTIVE").toUpperCase() === "SUSPENDED" ? "SUSPENDED" : "ACTIVE"
  );
  const [selectedRoleId, setSelectedRoleId] = React.useState<number | null>(
    user.roleId ?? null
  );
  const [selectedRoleName, setSelectedRoleName] = React.useState<string>(
    user.roleName || "viewer"
  );
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(
    user.projectRoles && user.projectRoles.length > 0
      ? user.projectRoles[0].projectId
      : ""
  );
  const [reason, setReason] = React.useState("");

  const [showPasswordReset, setShowPasswordReset] = React.useState(
    initialShowPasswordReset
  );
  const [newPassword, setNewPassword] = React.useState("");
  const [temporaryPassword, setTemporaryPassword] = React.useState(true);

  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setFullName(user.fullName || user.username || "");
    setPhone(user.phone && user.phone !== "—" ? user.phone : "");
    setJobTitle(user.jobTitle || "");
    setStatus(
      (user.status || "ACTIVE").toUpperCase() === "SUSPENDED" ? "SUSPENDED" : "ACTIVE"
    );
    setSelectedRoleId(user.roleId ?? null);
    setSelectedRoleName(user.roleName || "viewer");
    setSelectedProjectId(
      user.projectRoles && user.projectRoles.length > 0
        ? user.projectRoles[0].projectId
        : ""
    );
    setShowPasswordReset(initialShowPasswordReset);
  }, [user, initialShowPasswordReset]);

  React.useEffect(() => {
    if (roles.length > 0 && selectedRoleId === null && selectedRoleName) {
      const matched = roles.find(
        (r) => r.name.toLowerCase() === selectedRoleName.toLowerCase()
      );
      if (matched) {
        setSelectedRoleId(matched.id);
      }
    }
  }, [roles, selectedRoleId, selectedRoleName]);

  const activeRole = React.useMemo(() => {
    if (roles.length === 0) return null;
    return (
      roles.find(
        (r) =>
          (selectedRoleId !== null && r.id === selectedRoleId) ||
          (selectedRoleName && r.name.toLowerCase() === selectedRoleName.toLowerCase())
      ) || null
    );
  }, [roles, selectedRoleId, selectedRoleName]);

  const permissionStats = React.useMemo(() => {
    const cats = buildPermissionCategoriesForRole(scope, activeRole);
    let granted = 0;
    let total = 0;
    for (const cat of cats) {
      for (const item of cat.items) {
        total++;
        if (item.enabled) granted++;
      }
    }
    return { granted, total };
  }, [scope, activeRole]);

  const initialCleanPhone = user.phone && user.phone !== "—" ? user.phone : "";
  const initialCleanStatus =
    (user.status || "ACTIVE").toUpperCase() === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";

  const isDirty =
    fullName.trim() !== (user.fullName || user.username || "").trim() ||
    phone.trim() !== initialCleanPhone.trim() ||
    jobTitle.trim() !== (user.jobTitle || "").trim() ||
    status !== initialCleanStatus ||
    selectedRoleName.toLowerCase() !== (user.roleName || "viewer").toLowerCase();

  const statusUpper = (user.status || "ACTIVE").toUpperCase();
  const isEmailVerified =
    typeof user.emailVerified === "boolean"
      ? user.emailVerified
      : statusUpper === "ACTIVE";

  const handleRequestCancel = () => {
    if (isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    await onSave({
      id: user.id,
      fullName: fullName.trim() || user.fullName || user.email,
      email: user.email,
      phone: phone.trim(),
      jobTitle: jobTitle.trim(),
      roleId: selectedRoleId,
      roleName: selectedRoleName,
      status,
      projectId: selectedProjectId,
      reason: reason.trim() || "Administrative policy & profile update",
    });
  };

  const handleApplyPasswordReset = async () => {
    if (!onResetPassword || newPassword.trim().length < 8 || isResettingPassword) {
      return;
    }
    await onResetPassword({
      userId: user.id,
      email: user.email,
      newPassword: newPassword.trim(),
      temporary: temporaryPassword,
    });
    setNewPassword("");
    setShowPasswordReset(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {trKey(t, "users.cf_edit_policy_section", "Edit policy")}
            </span>
            <Pencil className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              ({user.email})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isEmailVerified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                <CheckCircle2 className="size-3" />
                {trKey(t, "users.email_verified", "Verified")}
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border bg-muted/60 text-muted-foreground border-border">
                  <Clock className="size-3" />
                  {trKey(t, "users.email_unverified", "Unverified")}
                </span>
                {onResendVerification && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isResendingVerification}
                    onClick={() => onResendVerification(user)}
                    className="h-6 px-2 text-[11px] font-medium gap-1"
                  >
                    {isResendingVerification ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3" />
                    )}
                    {trKey(t, "users.ctx_resend_verification", "Resend Verification")}
                  </Button>
                )}
              </div>
            )}

            {onResetPassword && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  setShowPasswordReset((prev) => !prev);
                  if (!newPassword) {
                    setNewPassword(generateStrongCryptoPassword(16));
                  }
                }}
                className="h-6 px-2 text-[11px] font-medium gap-1"
              >
                <KeyRound className="size-3 text-primary" />
                {trKey(t, "users.cf_reset_password_toggle", "Reset Member Password")}
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-5">
          <UserEditIdentitySection
            scope={scope}
            email={user.email}
            fullName={fullName}
            onFullNameChange={setFullName}
            phone={phone}
            onPhoneChange={setPhone}
            jobTitle={jobTitle}
            onJobTitleChange={setJobTitle}
            status={status}
            onStatusChange={setStatus}
            reason={reason}
            onReasonChange={setReason}
            showPasswordReset={showPasswordReset}
            canResetPassword={Boolean(onResetPassword)}
            isResettingPassword={isResettingPassword}
            newPassword={newPassword}
            onNewPasswordChange={setNewPassword}
            temporaryPassword={temporaryPassword}
            onTemporaryPasswordChange={setTemporaryPassword}
            onApplyPasswordReset={handleApplyPasswordReset}
            t={t}
          />

          <PermissionPoliciesAccordion
            scope={scope}
            scopeAccountName={scopeAccountName}
            targetMemberLabel={user.email}
            roles={roles}
            selectedRoleId={selectedRoleId}
            selectedRoleName={selectedRoleName}
            onSelectRole={(role) => {
              setSelectedRoleId(role.id);
              setSelectedRoleName(role.name);
            }}
            projects={projects}
            selectedProjectId={selectedProjectId || "ALL"}
            onSelectProjectId={setSelectedProjectId}
            t={t}
          />

          <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                {activeRole
                  ? trKey(
                      t,
                      "users.cf_active_policy_summary",
                      "Active Policy: {{role}} [{{code}}] — {{granted}}/{{total}} Permissions Granted",
                      {
                        role: activeRole.displayName || activeRole.name,
                        code: resolveCanonicalRoleCode(activeRole.name, activeRole.code, scope),
                        granted: permissionStats.granted,
                        total: permissionStats.total,
                      }
                    )
                  : trKey(t, "users.cf_no_role_selected", "No Role Selected")}
              </span>
            </div>

            <Badge
              variant="outline"
              className="text-[10px] font-mono px-2 py-0.5 bg-muted/40 text-muted-foreground border-border"
            >
              {trKey(t, "users.cf_rbac_mode", "Role-based Access Control (RBAC)")}
            </Badge>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <div>
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting || isSaving}
                onClick={() => setDeleteDialogOpen(true)}
                className="h-7 px-2.5 text-xs font-medium"
              >
                {trKey(t, "common.delete", "Delete")}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={handleRequestCancel}
              className="h-7 px-2.5 text-xs font-medium"
            >
              {trKey(t, "common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSaving}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              {trKey(t, "common.save", "Save")}
            </Button>
          </div>
        </div>
      </div>

      <UserDiscardConfirmDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        variant="edit"
        t={t}
        onConfirmLeave={onCancel}
      />

      {onDelete && (
        <UserDeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          user={user}
          isDeleting={isDeleting}
          t={t}
          onConfirmDelete={() => onDelete(user)}
        />
      )}
    </form>
  );
}
