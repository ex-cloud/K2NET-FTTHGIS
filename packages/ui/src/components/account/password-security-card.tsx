import * as React from "react";
import { KeyRound, Eye, EyeOff, Check, X, Shield, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../card";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Progress } from "../progress";
import { PasswordPolicyData, AccountLabels } from "./account-types";

export interface PasswordSecurityCardProps {
  policy?: PasswordPolicyData;
  labels?: AccountLabels;
  onChangePassword?: (data: { currentPassword: string; newPassword: string }) => Promise<void> | void;
  isLoading?: boolean;
}

export function PasswordSecurityCard({
  policy = {
    minLength: 8,
    requireSymbols: false,
    requireNumbers: false,
    requireUppercase: false,
  },
  labels,
  onChangePassword,
  isLoading = false,
}: PasswordSecurityCardProps) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Policy requirement checks
  const minLength = policy.minLength || 8;
  const hasMinLength = newPassword.length >= minLength;
  const hasUppercase = !policy.requireUppercase || /[A-Z]/.test(newPassword);
  const hasNumber = !policy.requireNumbers || /[0-9]/.test(newPassword);
  const hasSymbol = !policy.requireSymbols || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Strength score
  const passedCount = [hasMinLength, hasUppercase, hasNumber, hasSymbol].filter(Boolean).length;
  const totalChecks = 4;
  const strengthPercentage = Math.round((passedCount / totalChecks) * 100);

  const getStrengthLabel = () => {
    if (strengthPercentage <= 50) return labels?.strengthWeak || "Weak";
    if (strengthPercentage <= 75) return labels?.strengthMedium || "Good";
    return labels?.strengthStrong || "Strong";
  };

  const getStrengthColorClass = () => {
    if (strengthPercentage <= 50) return "text-destructive";
    if (strengthPercentage <= 75) return "text-amber-500";
    return "text-emerald-500";
  };

  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    hasSymbol &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(labels?.passwordMismatchError || "New password and confirmation do not match.");
      return;
    }

    if (!isFormValid || !onChangePassword) return;

    try {
      setIsSubmitting(true);
      await onChangePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(labels?.passwordChangeFailed || "Failed to change password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-border/80 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <KeyRound className="size-4 text-muted-foreground" />
          {labels?.passwordTitle || "Password & Authentication"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {labels?.passwordDesc || "Ensure your account is protected with a strong, policy-compliant password."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="account-current-password" className="text-xs font-medium">
              {labels?.currentPasswordLabel || "Current Password"}
            </Label>
            <div className="relative">
              <Input
                id="account-current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={labels?.currentPasswordPlaceholder || "Enter current password"}
                className="pr-8 h-8 text-xs font-mono"
                disabled={isLoading || isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="account-new-password" className="text-xs font-medium">
                {labels?.newPasswordLabel || "New Password"}
              </Label>
              <div className="relative">
                <Input
                  id="account-new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={labels?.newPasswordPlaceholder || "Enter new secure password"}
                  className="pr-8 h-8 text-xs font-mono"
                  disabled={isLoading || isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-confirm-password" className="text-xs font-medium">
                {labels?.confirmPasswordLabel || "Confirm New Password"}
              </Label>
              <div className="relative">
                <Input
                  id="account-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={labels?.confirmPasswordPlaceholder || "Re-enter new password"}
                  className="pr-8 h-8 text-xs font-mono"
                  disabled={isLoading || isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Strength Meter & Checklist */}
          {newPassword.length > 0 && (
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield className="size-3.5" />
                  {labels?.passwordPolicyTitle || "Active Password Policy"}
                </span>
                <span className={getStrengthColorClass()}>{getStrengthLabel()}</span>
              </div>
              <Progress value={strengthPercentage} className="h-1.5" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  {hasMinLength ? (
                    <Check className="size-3 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="size-3 text-muted-foreground shrink-0" />
                  )}
                  <span className={hasMinLength ? "text-foreground font-medium" : "text-muted-foreground"}>
                    {labels?.policyMinLength?.replace("{{length}}", String(minLength)) ||
                      `At least ${minLength} characters`}
                  </span>
                </div>

                {policy.requireUppercase && (
                  <div className="flex items-center gap-1.5">
                    {hasUppercase ? (
                      <Check className="size-3 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="size-3 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasUppercase ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {labels?.policyUppercase || "At least one uppercase letter (A-Z)"}
                    </span>
                  </div>
                )}

                {policy.requireNumbers && (
                  <div className="flex items-center gap-1.5">
                    {hasNumber ? (
                      <Check className="size-3 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="size-3 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasNumber ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {labels?.policyNumbers || "At least one numeric digit (0-9)"}
                    </span>
                  </div>
                )}

                {policy.requireSymbols && (
                  <div className="flex items-center gap-1.5">
                    {hasSymbol ? (
                      <Check className="size-3 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="size-3 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasSymbol ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {labels?.policySymbols || "At least one special character (!@#$%...)"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2 pb-4 border-t border-border/40 flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!isFormValid || isLoading || isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>{labels?.saving || "Saving..."}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5" />
                <span>{labels?.changePasswordBtn || "Update Password"}</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
