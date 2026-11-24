import * as React from "react";
import {
  Fingerprint,
  KeyRound,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { Button } from "../button";
import { Input } from "../input";
import { base64UrlToBuffer, bufferToBase64Url } from "../account/passkey-register-modal";

export type SudoModalMethod = "webauthn" | "totp" | "email_otp" | "backup_code" | "password";

export interface SudoModalStatusPayload {
  isBreakGlass?: boolean;
  availableMethods: SudoModalMethod[];
  maskedEmail?: string;
}

export interface SudoVerifySubmitPayload {
  method: SudoModalMethod;
  code?: string;
  password?: string;
  credentialId?: string;
  clientDataJSON?: string;
  authenticatorData?: string;
  signature?: string;
}

export interface SudoReauthLabels {
  title?: string;
  subtitleAction?: string;
  subtitleBreakGlass?: string;
  subtitleDefault?: string;
  methodLabel?: string;
  methodWebauthn?: string;
  methodTotp?: string;
  methodEmailOtp?: string;
  methodBackupCode?: string;
  methodPassword?: string;
  passkeyPromptDesc?: string;
  passkeyVerifyBtn?: string;
  passkeyVerifying?: string;
  passkeyCancelled?: string;
  passkeyUnsupported?: string;
  totpPromptDesc?: string;
  totpPlaceholder?: string;
  emailOtpSendBtn?: string;
  emailOtpResendIn?: string;
  emailOtpSentHint?: string;
  emailOtpPlaceholder?: string;
  backupCodePromptDesc?: string;
  backupCodePlaceholder?: string;
  passwordPromptDesc?: string;
  passwordPlaceholder?: string;
  verifyBtn?: string;
  verifyingBtn?: string;
  cancelBtn?: string;
  attemptsRemaining?: string;
  rateLimited?: string;
}

export interface SudoReauthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: SudoModalStatusPayload | null;
  actionName?: string;
  isBreakGlass?: boolean;
  labels?: SudoReauthLabels;
  onGetWebauthnChallenge: () => Promise<{
    challenge: string;
    rpId: string;
    allowCredentials?: Array<{ type: string; id: string }>;
    timeout?: number;
    userVerification?: string;
  }>;
  onSendEmailOtp: () => Promise<{
    sent: boolean;
    maskedEmail?: string;
    cooldownSeconds?: number;
    retryAfterSeconds?: number;
    message?: string;
  }>;
  onVerify: (payload: SudoVerifySubmitPayload) => Promise<{
    ok: boolean;
    error?: string;
    message?: string;
    attemptsRemaining?: number;
    retryAfterSeconds?: number;
  }>;
  onSuccess: () => void;
  onCancel: () => void;
}

const METHOD_ORDER: SudoModalMethod[] = ["webauthn", "totp", "email_otp", "backup_code", "password"];

export function SudoReauthModal({
  open,
  onOpenChange,
  status,
  actionName,
  isBreakGlass,
  labels,
  onGetWebauthnChallenge,
  onSendEmailOtp,
  onVerify,
  onSuccess,
  onCancel,
}: SudoReauthModalProps) {
  const availableMethods = React.useMemo(() => {
    const list = status?.availableMethods || [];
    return METHOD_ORDER.filter((m) => list.includes(m));
  }, [status?.availableMethods]);

  const [activeMethod, setActiveMethod] = React.useState<SudoModalMethod>("totp");
  const [codeInput, setCodeInput] = React.useState("");
  const [passwordInput, setPasswordInput] = React.useState("");
  const [emailSent, setEmailSent] = React.useState(false);
  const [emailCooldown, setEmailCooldown] = React.useState(0);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setCodeInput("");
      setPasswordInput("");
      setEmailSent(false);
      setIsSubmitting(false);
      setErrorMessage(null);
      if (availableMethods.length > 0) {
        setActiveMethod(availableMethods[0]);
      }
    }
  }, [open, availableMethods]);

  React.useEffect(() => {
    if (emailCooldown <= 0) return;
    const t = window.setInterval(() => {
      setEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [emailCooldown]);

  const effectiveBreakGlass = Boolean(isBreakGlass || status?.isBreakGlass);
  const subtitle = React.useMemo(() => {
    if (effectiveBreakGlass) {
      return (
        labels?.subtitleBreakGlass ||
        "Break-Glass sessions require cryptographic identity verification before accessing billing, SSO, or security controls."
      );
    }
    if (actionName) {
      const tpl =
        labels?.subtitleAction ||
        "You are performing a sensitive security action ({{action}}). Verify your identity to unlock elevated access for 15 minutes.";
      return tpl.replace("{{action}}", actionName);
    }
    return (
      labels?.subtitleDefault ||
      "Verify your identity to confirm access to sensitive platform and security settings for the next 15 minutes."
    );
  }, [actionName, effectiveBreakGlass, labels]);

  const methodLabel = (method: SudoModalMethod): string => {
    switch (method) {
      case "webauthn":
        return labels?.methodWebauthn || "Passkey";
      case "totp":
        return labels?.methodTotp || "Authenticator";
      case "email_otp":
        return labels?.methodEmailOtp || "Email OTP";
      case "backup_code":
        return labels?.methodBackupCode || "Backup Code";
      case "password":
        return labels?.methodPassword || "Password";
    }
  };

  const methodIcon = (method: SudoModalMethod) => {
    switch (method) {
      case "webauthn":
        return <Fingerprint className="size-3.5" />;
      case "totp":
        return <Smartphone className="size-3.5" />;
      case "email_otp":
        return <Mail className="size-3.5" />;
      case "backup_code":
        return <KeyRound className="size-3.5" />;
      case "password":
        return <Lock className="size-3.5" />;
    }
  };

  const applyFailureFeedback = (res: {
    error?: string;
    message?: string;
    attemptsRemaining?: number;
    retryAfterSeconds?: number;
  }) => {
    if (res.error === "SUDO_RATE_LIMITED" && res.retryAfterSeconds) {
      const tpl =
        labels?.rateLimited ||
        "Too many failed attempts. Please wait {{seconds}}s before trying again.";
      setErrorMessage(tpl.replace("{{seconds}}", String(res.retryAfterSeconds)));
      return;
    }
    let msg = res.message || "Verification failed.";
    if (typeof res.attemptsRemaining === "number") {
      const att = (
        labels?.attemptsRemaining || "{{count}} attempt(s) remaining before temporary lockout."
      ).replace("{{count}}", String(res.attemptsRemaining));
      msg = `${msg} ${att}`;
    }
    setErrorMessage(msg);
  };

  const handleVerifyPasskey = async () => {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      setErrorMessage(labels?.passkeyUnsupported || "WebAuthn Passkey is not supported by this browser.");
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const ch = await onGetWebauthnChallenge();
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: base64UrlToBuffer(ch.challenge) as unknown as BufferSource,
          rpId: ch.rpId,
          allowCredentials: (ch.allowCredentials || []).map((c) => ({
            type: "public-key" as const,
            id: base64UrlToBuffer(c.id) as unknown as BufferSource,
          })),
          userVerification: (ch.userVerification as UserVerificationRequirement) || "preferred",
          timeout: ch.timeout || 120000,
        },
      })) as PublicKeyCredential | null;

      if (!assertion) {
        setErrorMessage(labels?.passkeyCancelled || "Passkey verification was cancelled or timed out.");
        return;
      }

      const resp = assertion.response as AuthenticatorAssertionResponse;
      const result = await onVerify({
        method: "webauthn",
        credentialId: bufferToBase64Url(assertion.rawId),
        clientDataJSON: bufferToBase64Url(resp.clientDataJSON),
        authenticatorData: bufferToBase64Url(resp.authenticatorData),
        signature: bufferToBase64Url(resp.signature),
      });

      if (result.ok) {
        onSuccess();
      } else {
        applyFailureFeedback(result);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setErrorMessage(labels?.passkeyCancelled || "Passkey verification was cancelled or timed out.");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Passkey verification failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmailCode = async () => {
    try {
      setIsSendingEmail(true);
      setErrorMessage(null);
      const res = await onSendEmailOtp();
      if (res.sent) {
        setEmailSent(true);
        setEmailCooldown(res.cooldownSeconds || 60);
      } else {
        if (res.retryAfterSeconds) {
          setEmailCooldown(res.retryAfterSeconds);
        }
        setErrorMessage(res.message || "Failed to send verification code.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send email code.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeMethod === "webauthn") {
      await handleVerifyPasskey();
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const result = await onVerify({
        method: activeMethod,
        code: activeMethod !== "password" ? codeInput.trim() : undefined,
        password: activeMethod === "password" ? passwordInput : undefined,
      });

      if (result.ok) {
        onSuccess();
      } else {
        applyFailureFeedback(result);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted/50 text-foreground shrink-0">
              {effectiveBreakGlass ? (
                <ShieldAlert className="size-4" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
            </div>
            <DialogTitle className="text-sm font-semibold text-foreground">
              {labels?.title || "Confirm Your Identity (Sudo Mode)"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1.5">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        {status === null ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {availableMethods.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {labels?.methodLabel || "Verification method"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {availableMethods.map((m) => (
                    <Button
                      key={m}
                      type="button"
                      size="sm"
                      variant={activeMethod === m ? "default" : "outline"}
                      onClick={() => {
                        setActiveMethod(m);
                        setCodeInput("");
                        setPasswordInput("");
                        setErrorMessage(null);
                      }}
                      className="h-7 px-2.5 text-xs font-medium gap-1.5"
                    >
                      {methodIcon(m)}
                      <span>{methodLabel(m)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {activeMethod === "webauthn" && (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {labels?.passkeyPromptDesc ||
                    "Use Windows Hello, Touch ID, or your registered FIDO2 security key to unlock Sudo Mode."}
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => void handleVerifyPasskey()}
                  className="h-7 px-2.5 text-xs font-medium gap-1.5 w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Fingerprint className="size-3.5" />
                  )}
                  <span>
                    {isSubmitting
                      ? labels?.passkeyVerifying || "Waiting for passkey..."
                      : labels?.passkeyVerifyBtn || "Verify with Passkey"}
                  </span>
                </Button>
              </div>
            )}

            {activeMethod === "totp" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {labels?.totpPromptDesc || "Enter the 6-digit code from your Authenticator app."}
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  autoFocus
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder={labels?.totpPlaceholder || "000000"}
                  className="font-mono tracking-widest text-center text-sm"
                />
              </div>
            )}

            {activeMethod === "email_otp" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {emailSent
                      ? (
                          labels?.emailOtpSentHint || "A 6-digit code has been sent to {{email}}."
                        ).replace("{{email}}", status.maskedEmail || "")
                      : status.maskedEmail || ""}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSendingEmail || emailCooldown > 0}
                    onClick={() => void handleSendEmailCode()}
                    className="h-7 px-2.5 text-xs font-medium shrink-0 gap-1.5"
                  >
                    {isSendingEmail && <Loader2 className="size-3 animate-spin" />}
                    <span>
                      {emailCooldown > 0
                        ? (labels?.emailOtpResendIn || "Resend in {{seconds}}s").replace(
                            "{{seconds}}",
                            String(emailCooldown)
                          )
                        : labels?.emailOtpSendBtn || "Send 6-Digit Code"}
                    </span>
                  </Button>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder={labels?.emailOtpPlaceholder || "Enter 6-digit email code"}
                  className="font-mono tracking-widest text-center text-sm"
                />
              </div>
            )}

            {activeMethod === "backup_code" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {labels?.backupCodePromptDesc ||
                    "Enter one of your single-use offline recovery codes (e.g. ABCD-EFGH)."}
                </p>
                <Input
                  type="text"
                  autoFocus
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder={labels?.backupCodePlaceholder || "XXXX-XXXX"}
                  className="font-mono tracking-wider text-center text-sm uppercase"
                />
              </div>
            )}

            {activeMethod === "password" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {labels?.passwordPromptDesc ||
                    "Enter your account password to confirm Sudo Mode."}
                </p>
                <Input
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={labels?.passwordPlaceholder || "Enter account password"}
                />
              </div>
            )}

            {errorMessage && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onCancel();
                  onOpenChange(false);
                }}
                className="h-7 px-2.5 text-xs font-medium"
              >
                {labels?.cancelBtn || "Cancel"}
              </Button>
              {activeMethod !== "webauthn" && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    isSubmitting ||
                    (activeMethod === "password" ? !passwordInput : !codeInput.trim())
                  }
                  className="h-7 px-2.5 text-xs font-medium gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-3.5" />
                  )}
                  <span>
                    {isSubmitting
                      ? labels?.verifyingBtn || "Verifying..."
                      : labels?.verifyBtn || "Confirm & Unlock (15m)"}
                  </span>
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
