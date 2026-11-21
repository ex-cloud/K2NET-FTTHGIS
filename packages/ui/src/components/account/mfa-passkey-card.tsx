import * as React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Smartphone,
  Key,
  KeyRound,
  Mail,
  Info,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../dialog";
import { Button } from "../button";
import { Badge } from "../badge";
import {
  PlaneType,
  PersonalSecuritySummaryData,
  AccountLabels,
  WebauthnCredentialData,
  BackupCodesStatusData,
} from "./account-types";
import { BackupCodesModal } from "./backup-codes-modal";

export interface MfaPasskeyCardProps {
  plane?: PlaneType;
  summary?: PersonalSecuritySummaryData;
  passkeys?: WebauthnCredentialData[];
  labels?: AccountLabels;
  onSetupTotp?: () => void;
  onDisableTotp?: () => void;
  onSetupPasskey?: () => void;
  onDeletePasskey?: (credentialId: string) => void;
  onSetupEmailOtp?: () => void;
  onDisableEmailOtp?: () => void;
  onFetchBackupCodesStatus?: () => Promise<BackupCodesStatusData>;
  onGenerateBackupCodes?: () => Promise<{
    success: boolean;
    codes: string[];
    remainingCount?: number;
    totalCount?: number;
    generatedAt?: string;
    message?: string;
  }>;
  onBackupCodesSuccess?: () => void;
  isLoading?: boolean;
}

type ConfirmActionState =
  | { type: "disable_totp" }
  | { type: "disable_email" }
  | { type: "delete_passkey"; credentialId: string; deviceName: string }
  | null;

interface MfaActionConfirmModalProps {
  action: ConfirmActionState;
  labels?: AccountLabels;
  onClose: () => void;
  onConfirm: () => void;
}

function MfaActionConfirmModal({
  action,
  labels,
  onClose,
  onConfirm,
}: MfaActionConfirmModalProps) {
  if (!action) return null;

  let title = labels?.mfaDisableConfirmTitle || "Disable Two-Factor Authentication?";
  let description =
    labels?.mfaDisableConfirmDesc ||
    "Are you sure you want to disable two-factor authentication? Your account will only be protected by your password.";
  let confirmLabel = labels?.mfaDisableBtn || "Disable 2FA";

  if (action.type === "disable_email") {
    title = labels?.mfaEmailDisableConfirmTitle || "Disable Email Authentication?";
    description =
      labels?.mfaEmailDisableConfirmDesc ||
      "Are you sure you want to disable email two-factor authentication?";
    confirmLabel = labels?.mfaDisableEmailBtn || "Disable Email 2FA";
  } else if (action.type === "delete_passkey") {
    title = labels?.passkeyDeleteConfirmTitle || "Remove Passkey?";
    description = `${
      labels?.passkeyDeleteConfirmDesc ||
      "Are you sure you want to remove this passkey from your account?"
    } (${action.deviceName})`;
    confirmLabel = labels?.removePasskeyBtn || "Remove";
  }

  return (
    <Dialog open={Boolean(action)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border border-border text-foreground p-5">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <ShieldAlert className="size-4 text-destructive" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            {labels?.cancelBtn || "Cancel"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="gap-1.5 text-xs font-medium"
          >
            <Trash2 className="size-3.5" />
            <span>{confirmLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MfaPasskeyCard({
  plane = "TENANT",
  summary,
  passkeys,
  labels,
  onSetupTotp,
  onDisableTotp,
  onSetupPasskey,
  onDeletePasskey,
  onSetupEmailOtp,
  onDisableEmailOtp,
  onFetchBackupCodesStatus,
  onGenerateBackupCodes,
  onBackupCodesSuccess,
  isLoading = false,
}: MfaPasskeyCardProps) {
  const [confirmAction, setConfirmAction] = React.useState<ConfirmActionState>(null);
  const [isBackupCodesModalOpen, setIsBackupCodesModalOpen] = React.useState(false);

  const isSystemPlane = plane === "SYSTEM";
  const isEnforced = Boolean(isSystemPlane || summary?.mfaEnforced);
  const hasPasskeys = Boolean((passkeys && passkeys.length > 0) || summary?.passkeyEnabled);
  const isEmailOtpActive = Boolean(summary?.emailOtpEnabled);
  const isEmailVerified = Boolean(summary?.emailVerified ?? Boolean(summary?.email));
  const isTotpActive = Boolean(
    summary?.totpEnabled ??
      (summary?.mfaEnabled && (!passkeys || passkeys.length === 0) && !isEmailOtpActive)
  );
  const isMfaActive = Boolean(
    summary?.mfaEnabled || isTotpActive || hasPasskeys || isEmailOtpActive
  );

  const canDisableTotp = !isEnforced || hasPasskeys || isEmailOtpActive;
  const canDisableEmail = !isEnforced || isTotpActive || hasPasskeys;

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "disable_totp" && onDisableTotp) {
      onDisableTotp();
    } else if (confirmAction.type === "disable_email" && onDisableEmailOtp) {
      onDisableEmailOtp();
    } else if (confirmAction.type === "delete_passkey" && onDeletePasskey) {
      onDeletePasskey(confirmAction.credentialId);
    }
  };

  return (
    <>
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="size-4 text-muted-foreground" />
                {labels?.mfaTitle || "Multi-Factor Authentication (2FA & Passkeys)"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                {labels?.mfaDesc ||
                  "Protect your account with an extra layer of verification via TOTP Authenticator, Passkey, or Verified Email."}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isMfaActive ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-primary/40 bg-primary/10 text-primary text-[11px] font-medium"
                >
                  <CheckCircle2 className="size-3" />
                  <span>{labels?.mfaStatusActive || "2FA Active"}</span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 border-border/80 bg-muted/40 text-muted-foreground text-[11px] font-medium"
                >
                  <ShieldAlert className="size-3" />
                  <span>{labels?.mfaStatusInactive || "Not Configured"}</span>
                </Badge>
              )}

              {isSystemPlane ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-primary/40 bg-primary/10 text-primary text-[10px] font-mono uppercase"
                >
                  <Lock className="size-3" />
                  <span>{labels?.mfaLockedPlatform || "Tier 0 PAM Baseline"}</span>
                </Badge>
              ) : summary?.mfaEnforced ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-primary/40 bg-primary/10 text-primary text-[10px] font-mono uppercase"
                >
                  <Lock className="size-3" />
                  <span>{labels?.mfaLockedTenant || "Org Enforced"}</span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 text-[10px] font-mono text-muted-foreground"
                >
                  <span>{labels?.mfaOptional || "Optional"}</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isEnforced ? (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-primary/30 bg-primary/5 text-foreground text-xs">
              <Info className="size-4 shrink-0 mt-0.5 text-primary" />
              <div className="space-y-0.5">
                <p className="font-semibold">
                  {isSystemPlane
                    ? labels?.mfaLockedPlatform || "Mandatory Platform Baseline (Tier 0 PAM Standard)"
                    : labels?.mfaLockedTenant || "Mandatory by Organization Security Policy"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isSystemPlane
                    ? "Platform operator and super admin accounts require mandatory 2FA/Passkey verification to protect platform infrastructure."
                    : "Your organization administrator enforces two-factor authentication for all workspace members."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground">
              <Info className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
              <p>
                {labels?.mfaOptInNotice ||
                  "You can voluntarily enroll two-factor authentication to secure your account against credential stuffing."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
            {/* Method 1: Authenticator App (TOTP) */}
            <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-4 text-muted-foreground shrink-0" />
                    <h4 className="text-xs font-semibold">Authenticator App (TOTP)</h4>
                  </div>
                  {isTotpActive && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-primary/40 bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0"
                    >
                      <CheckCircle2 className="size-2.5" />
                      <span>Active</span>
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Google Authenticator, Microsoft Authenticator, 1Password, or Bitwarden.
                </p>
              </div>
              {isTotpActive ? (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onSetupTotp}
                    disabled={isLoading}
                    className="w-full gap-1.5 text-xs"
                  >
                    <Smartphone className="size-3.5" />
                    <span>{labels?.mfaReconfigureBtn || "Re-configure Authenticator"}</span>
                  </Button>
                  {canDisableTotp && onDisableTotp && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmAction({ type: "disable_totp" })}
                      disabled={isLoading}
                      className="w-full gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <span>{labels?.mfaDisableBtn || "Disable 2FA"}</span>
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSetupTotp}
                  disabled={isLoading}
                  className="w-full gap-1.5 text-xs"
                >
                  <Smartphone className="size-3.5" />
                  <span>{labels?.mfaSetupTotp || "Set Up Authenticator App"}</span>
                </Button>
              )}
            </div>

            {/* Method 2: Security Keys & Passkeys (FIDO2) */}
            <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Key className="size-4 text-muted-foreground shrink-0" />
                    <h4 className="text-xs font-semibold">Security Keys & Passkeys (FIDO2)</h4>
                  </div>
                  {hasPasskeys && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-primary/40 bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0"
                    >
                      <CheckCircle2 className="size-2.5" />
                      <span>
                        {passkeys && passkeys.length > 0 ? `${passkeys.length} Active` : "Active"}
                      </span>
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Hardware keys like YubiKey, Apple Touch ID, or Windows Hello.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSetupPasskey}
                disabled={isLoading}
                className="w-full gap-1.5 text-xs"
              >
                <Key className="size-3.5" />
                <span>{labels?.mfaSetupPasskey || "Register Passkey (FIDO2)"}</span>
              </Button>
            </div>

            {/* Method 3: Email Authentication (Email OTP) */}
            <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                    <h4 className="text-xs font-semibold">
                      {labels?.mfaEmailCardTitle || "Email Authentication (Email OTP)"}
                    </h4>
                  </div>
                  {isEmailOtpActive ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-primary/40 bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0"
                    >
                      <CheckCircle2 className="size-2.5" />
                      <span>Active</span>
                    </Badge>
                  ) : isEmailVerified ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-border/80 bg-muted/40 text-muted-foreground text-[10px] font-medium px-1.5 py-0"
                    >
                      <CheckCircle2 className="size-2.5" />
                      <span>{labels?.mfaEmailVerifiedBadge || "Email Verified"}</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 border-destructive/40 bg-destructive/10 text-destructive text-[10px] font-medium px-1.5 py-0"
                    >
                      <ShieldAlert className="size-2.5" />
                      <span>{labels?.mfaEmailUnverifiedBadge || "Verification Pending"}</span>
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {labels?.mfaEmailCardDesc ||
                    "Receive 6-digit verification codes via your verified email address."}
                </p>
                {!isEmailVerified && (
                  <p className="text-[10px] text-destructive pt-0.5">
                    {labels?.mfaEmailUnverifiedHint ||
                      "Your email address must be verified before enabling Email 2FA."}
                  </p>
                )}
              </div>

              {isEmailOtpActive ? (
                canDisableEmail && onDisableEmailOtp ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmAction({ type: "disable_email" })}
                    disabled={isLoading}
                    className="w-full gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <span>{labels?.mfaDisableEmailBtn || "Disable Email 2FA"}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="w-full gap-1.5 text-xs"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Email 2FA Active</span>
                  </Button>
                )
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSetupEmailOtp}
                  disabled={isLoading || !isEmailVerified}
                  className="w-full gap-1.5 text-xs"
                >
                  <Mail className="size-3.5" />
                  <span>{labels?.mfaSetupEmail || "Enable Email 2FA"}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Method 4: Emergency Offline Recovery Codes (Fase 7.10 / ADR-0022) */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-muted-foreground shrink-0" />
                <h4 className="text-xs font-semibold">
                  {labels?.backupCodesTitle || "Emergency Recovery Codes (Offline 2FA)"}
                </h4>
                {summary?.backupCodesConfigured && summary?.backupCodesRemaining !== undefined ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-primary/40 bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0"
                  >
                    <CheckCircle2 className="size-2.5" />
                    <span>
                      {summary.backupCodesRemaining} of {summary.backupCodesTotal || 10} Codes Available
                    </span>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 border-border/80 bg-muted/40 text-muted-foreground text-[10px] font-medium px-1.5 py-0"
                  >
                    <ShieldAlert className="size-2.5" />
                    <span>Not Configured</span>
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {labels?.backupCodesDesc ||
                  "Generate 10 single-use 8-character codes you can print or store in a password manager to sign in during emergency hardware lockout or disaster recovery."}
              </p>
            </div>

            {(onFetchBackupCodesStatus || onGenerateBackupCodes) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBackupCodesModalOpen(true)}
                disabled={isLoading}
                className="shrink-0 gap-1.5 text-xs h-7 cursor-pointer"
              >
                <KeyRound className="size-3.5" />
                <span>
                  {summary?.backupCodesConfigured
                    ? labels?.backupCodesViewBtn || "View / Regenerate Codes"
                    : labels?.backupCodesGenerateBtn || "Generate Backup Codes"}
                </span>
              </Button>
            )}
          </div>

          {/* Registered Passkeys List & Multi-Device Advisory (Fase 7.2 / ADR-0022) */}
          {passkeys && passkeys.length > 0 && (
            <div className="pt-3 space-y-2 border-t border-border/60">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Key className="size-3.5 text-muted-foreground" />
                  <span>
                    {labels?.registeredPasskeysTitle || "Registered Passkeys & Security Keys"}
                  </span>
                </h4>
                {passkeys.length >= 2 && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-primary/40 bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5"
                  >
                    <ShieldCheck className="size-3" />
                    <span>{labels?.passkeyMultiDeviceActiveBadge || "Multi-Device Redundancy (Active)"}</span>
                  </Badge>
                )}
              </div>

              {/* Single Passkey Educational Warning (Anti-Lockout Advisory) */}
              {passkeys.length === 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">
                        {labels?.passkeySingleDeviceWarningTitle || "Single Passkey Advisory (Anti-Lockout)"}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {labels?.passkeySingleDeviceWarningDesc ||
                          "You only have 1 security key registered. If this device is lost, formatted, or broken, you may risk being locked out. We strongly recommend registering a secondary key (smartphone or YubiKey)."}
                      </p>
                    </div>
                  </div>
                  {onSetupPasskey && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onSetupPasskey}
                      disabled={isLoading}
                      className="shrink-0 text-xs gap-1.5 h-7 cursor-pointer"
                    >
                      <Key className="size-3" />
                      <span>{labels?.passkeyAddSecondaryBtn || "+ Add Secondary Passkey"}</span>
                    </Button>
                  )}
                </div>
              )}

              <div className="divide-y divide-border/60 rounded-lg border border-border/80 bg-background/50">
                {passkeys.map((p) => (
                  <div key={p.credentialId} className="flex items-center justify-between p-3 gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground">{p.deviceName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.createdAt
                          ? `Registered: ${new Date(p.createdAt).toLocaleDateString()}`
                          : "Passkey Active"}
                      </p>
                    </div>
                    {onDeletePasskey && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          setConfirmAction({
                            type: "delete_passkey",
                            credentialId: p.credentialId,
                            deviceName: p.deviceName,
                          })
                        }
                        disabled={isLoading}
                        className="h-6 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                      >
                        <Trash2 className="size-3" />
                        <span>{labels?.removePasskeyBtn || "Remove"}</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <MfaActionConfirmModal
        action={confirmAction}
        labels={labels}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      {onFetchBackupCodesStatus && onGenerateBackupCodes && (
        <BackupCodesModal
          open={isBackupCodesModalOpen}
          onOpenChange={setIsBackupCodesModalOpen}
          labels={labels}
          onFetchStatus={onFetchBackupCodesStatus}
          onGenerateCodes={onGenerateBackupCodes}
          onSuccess={onBackupCodesSuccess}
        />
      )}
    </>
  );
}
