import * as React from "react";
import {
  Loader2,
  Mail,
  Phone,
  Briefcase,
  User,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Checkbox } from "../checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import {
  type UnifiedUserScope,
  type UnifiedTranslateFn,
  trKey,
  generateStrongCryptoPassword,
} from "./user-management-types";

export interface UserEditIdentitySectionProps {
  scope: UnifiedUserScope;
  email: string;
  fullName: string;
  onFullNameChange: (val: string) => void;
  phone: string;
  onPhoneChange: (val: string) => void;
  jobTitle: string;
  onJobTitleChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  reason: string;
  onReasonChange: (val: string) => void;
  showPasswordReset: boolean;
  canResetPassword: boolean;
  isResettingPassword: boolean;
  newPassword: string;
  onNewPasswordChange: (val: string) => void;
  temporaryPassword: boolean;
  onTemporaryPasswordChange: (val: boolean) => void;
  onApplyPasswordReset: () => void;
  t?: UnifiedTranslateFn;
}

export function UserEditIdentitySection({
  scope,
  email,
  fullName,
  onFullNameChange,
  phone,
  onPhoneChange,
  jobTitle,
  onJobTitleChange,
  status,
  onStatusChange,
  reason,
  onReasonChange,
  showPasswordReset,
  canResetPassword,
  isResettingPassword,
  newPassword,
  onNewPasswordChange,
  temporaryPassword,
  onTemporaryPasswordChange,
  onApplyPasswordReset,
  t,
}: UserEditIdentitySectionProps) {
  const [showPlainPassword, setShowPlainPassword] = React.useState(true);

  return (
    <div className="p-3.5 rounded-lg border border-border/80 bg-muted/15 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
            <User className="size-3 text-muted-foreground" />
            {trKey(t, "users.invite_full_name", "Full Name")}
          </Label>
          <Input
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            className="h-8 text-xs bg-background border-border"
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
            <Phone className="size-3 text-primary" />
            {trKey(t, "users.invite_phone_label", "WhatsApp / Phone")}
          </Label>
          <Input
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={trKey(
              t,
              "users.invite_phone_placeholder",
              "e.g. 081234567890"
            )}
            className="h-8 text-xs font-mono bg-background border-border"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
            <Briefcase className="size-3 text-muted-foreground" />
            {trKey(t, "users.invite_job_title_label", "Job Title / Position")}
          </Label>
          <Input
            value={jobTitle}
            onChange={(e) => onJobTitleChange(e.target.value)}
            placeholder={trKey(
              t,
              "users.invite_job_title_placeholder",
              "e.g. NOC Shift Lead"
            )}
            className="h-8 text-xs bg-background border-border"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
            <Mail className="size-3 text-muted-foreground" />
            {trKey(t, "users.member_status_label", "Membership Status")}
          </Label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-8 text-xs bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-xs">
              <SelectItem value="ACTIVE">
                {trKey(t, "users.status_active", "Active")}
              </SelectItem>
              <SelectItem value="SUSPENDED">
                {trKey(t, "users.status_suspended", "Suspended")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {scope === "platform" && (
        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-muted-foreground">
            {trKey(t, "users.edit_audit_reason_label", "Audit Reason / Note")}
          </Label>
          <Input
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={trKey(
              t,
              "users.edit_audit_reason_placeholder",
              "e.g. Role adjustment or contact update"
            )}
            className="h-8 text-xs bg-background border-border"
          />
        </div>
      )}

      {showPasswordReset && canResetPassword && (
        <div className="pt-3 border-t border-border/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound className="size-3.5 text-primary" />
              {trKey(t, "users.cf_reset_password_new", "New Password")} ({email})
            </Label>
            <button
              type="button"
              onClick={() => onNewPasswordChange(generateStrongCryptoPassword(16))}
              className="text-[11px] text-primary hover:underline font-mono cursor-pointer inline-flex items-center gap-1"
            >
              <Sparkles className="size-3" />
              {trKey(t, "users.invite_generate_strong", "Generate Strong")}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Input
                type={showPlainPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => onNewPasswordChange(e.target.value)}
                className="h-8 text-xs font-mono bg-background border-border pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPlainPassword((p) => !p)}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPlainPassword ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </button>
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isResettingPassword || newPassword.trim().length < 8}
              onClick={onApplyPasswordReset}
              className="h-8 px-3 text-xs font-medium gap-1.5 shrink-0"
            >
              {isResettingPassword && <Loader2 className="size-3.5 animate-spin" />}
              {trKey(t, "users.cf_reset_password_btn", "Apply Password Reset")}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="temp-pwd-inline"
              checked={temporaryPassword}
              onCheckedChange={(c) => onTemporaryPasswordChange(c === true)}
            />
            <label
              htmlFor="temp-pwd-inline"
              className="text-[11px] text-muted-foreground cursor-pointer"
            >
              {trKey(
                t,
                "users.cf_reset_password_temp",
                "Force password change on next login"
              )}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
