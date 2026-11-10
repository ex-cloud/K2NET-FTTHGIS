import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Key,
  Mail,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import type { AuthLoginFormLabels } from "./auth-login-types";

export interface AuthMfaStepUpProps {
  availableMethods?: string[];
  maskedEmail?: string;
  totpCode: string;
  setTotpCode: (code: string) => void;
  onVerifyTotp?: (code: string) => Promise<boolean> | void;
  onSendEmailOtp?: () => Promise<boolean>;
  onVerifyEmailOtp?: (code: string) => Promise<boolean>;
  onVerifyWebauthn?: () => Promise<boolean>;
  onBackToLogin: () => void;
  labels?: AuthLoginFormLabels;
  isLoading?: boolean;
}

interface MfaMethodChooserListProps {
  hasWebauthn: boolean;
  hasTotp: boolean;
  hasEmailOtp: boolean;
  activeMethod: "totp" | "webauthn" | "email_otp";
  maskedEmail?: string;
  labels?: AuthLoginFormLabels;
  onSelectMethod: (method: "totp" | "webauthn" | "email_otp") => void;
  onCancelChooser: () => void;
}

function MfaMethodChooserList({
  hasWebauthn,
  hasTotp,
  hasEmailOtp,
  activeMethod,
  maskedEmail,
  labels,
  onSelectMethod,
  onCancelChooser,
}: MfaMethodChooserListProps) {
  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-foreground">
          {labels?.mfaChooseMethodTitle || "Choose a verification method"}
        </h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {labels?.mfaChooseMethodDesc || "Select how you want to verify your identity to sign in:"}
        </p>
      </div>

      <div className="space-y-2">
        {hasWebauthn && (
          <button
            type="button"
            onClick={() => onSelectMethod("webauthn")}
            className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
              activeMethod === "webauthn"
                ? "border-primary/50 bg-primary/5"
                : "border-border/80 bg-muted/20 hover:bg-muted/40 hover:border-foreground/30"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 p-1.5 rounded-md bg-background border border-border/70 text-foreground shrink-0">
                <Key className="size-3.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  {labels?.mfaTabWebauthn || "Windows Hello / Touch ID (Passkey)"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {labels?.mfaMethodWebauthnDesc ||
                    "Use your biometric sensor, Windows PIN, or security key"}
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </button>
        )}

        {hasTotp && (
          <button
            type="button"
            onClick={() => onSelectMethod("totp")}
            className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
              activeMethod === "totp"
                ? "border-primary/50 bg-primary/5"
                : "border-border/80 bg-muted/20 hover:bg-muted/40 hover:border-foreground/30"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 p-1.5 rounded-md bg-background border border-border/70 text-foreground shrink-0">
                <Smartphone className="size-3.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  {labels?.mfaTabTotp || "Authenticator App (TOTP)"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {labels?.mfaMethodTotpDesc ||
                    "Enter a 6-digit code from Google Authenticator or 1Password"}
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </button>
        )}

        {hasEmailOtp && (
          <button
            type="button"
            onClick={() => onSelectMethod("email_otp")}
            className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
              activeMethod === "email_otp"
                ? "border-primary/50 bg-primary/5"
                : "border-border/80 bg-muted/20 hover:bg-muted/40 hover:border-foreground/30"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 p-1.5 rounded-md bg-background border border-border/70 text-foreground shrink-0">
                <Mail className="size-3.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  {labels?.mfaTabEmailOtp || "Email Verification Code"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {maskedEmail
                    ? `${labels?.mfaEmailPrompt || "Send a 6-digit code to"} ${maskedEmail}`
                    : labels?.mfaMethodEmailDesc ||
                      "Receive a 6-digit verification code via your registered email"}
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </button>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCancelChooser}
        className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="size-3" />
        <span>{labels?.mfaBackToPrimary || "Back"}</span>
      </Button>
    </div>
  );
}

export function AuthMfaStepUp({
  availableMethods = ["totp", "email_otp"],
  maskedEmail,
  totpCode,
  setTotpCode,
  onVerifyTotp,
  onSendEmailOtp,
  onVerifyEmailOtp,
  onVerifyWebauthn,
  onBackToLogin,
  labels,
  isLoading = false,
}: AuthMfaStepUpProps) {
  const hasTotp = availableMethods.includes("totp");
  const hasWebauthn = availableMethods.includes("webauthn");
  const hasEmailOtp = availableMethods.includes("email_otp");

  const defaultMethod = hasWebauthn ? "webauthn" : hasTotp ? "totp" : "email_otp";
  const [activeMethod, setActiveMethod] = useState<"totp" | "webauthn" | "email_otp">(defaultMethod);
  const [isChoosingMethod, setIsChoosingMethod] = useState(false);

  // Sync activeMethod if availableMethods changes dynamically from server
  useEffect(() => {
    const nextDefault = availableMethods.includes("webauthn")
      ? "webauthn"
      : availableMethods.includes("totp")
        ? "totp"
        : "email_otp";
    if (!availableMethods.includes(activeMethod)) {
      setActiveMethod(nextDefault);
    }
  }, [availableMethods, activeMethod]);

  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isPromptingWebauthn, setIsPromptingWebauthn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendEmail = async () => {
    if (!onSendEmailOtp || resendCooldown > 0) return;
    try {
      setIsSendingEmail(true);
      setLocalError(null);
      const ok = await onSendEmailOtp();
      if (ok) {
        setEmailSent(true);
        setResendCooldown(60);
      }
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleTriggerWebauthn = async () => {
    if (!onVerifyWebauthn) return;
    try {
      setIsPromptingWebauthn(true);
      setLocalError(null);
      await onVerifyWebauthn();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Passkey verification failed");
    } finally {
      setIsPromptingWebauthn(false);
    }
  };

  const methodsCount = (hasTotp ? 1 : 0) + (hasWebauthn ? 1 : 0) + (hasEmailOtp ? 1 : 0);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* Local Error Banner */}
      {localError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 flex items-start gap-2 text-destructive text-xs">
          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">{localError}</p>
        </div>
      )}

      {isChoosingMethod && methodsCount > 1 ? (
        <MfaMethodChooserList
          hasWebauthn={hasWebauthn}
          hasTotp={hasTotp}
          hasEmailOtp={hasEmailOtp}
          activeMethod={activeMethod}
          maskedEmail={maskedEmail}
          labels={labels}
          onSelectMethod={(method) => {
            setActiveMethod(method);
            setIsChoosingMethod(false);
            setLocalError(null);
          }}
          onCancelChooser={() => setIsChoosingMethod(false)}
        />
      ) : (
        <>
          {/* Method 1: WebAuthn Passkeys (Windows Hello / Touch ID) */}
          {activeMethod === "webauthn" && (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Key className="size-3.5 text-muted-foreground" />
                  <span>{labels?.mfaTabWebauthn || "Windows Hello / Touch ID"}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {labels?.mfaPasskeyPrompt ||
                    "Use your registered biometric sensor, Windows PIN, or hardware key to verify your identity."}
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleTriggerWebauthn}
                disabled={isLoading || isPromptingWebauthn}
                className="w-full h-8 text-xs font-medium justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isPromptingWebauthn ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{labels?.waitingForPasskey || "Waiting for passkey..."}</span>
                  </>
                ) : (
                  <>
                    <Key className="size-3.5" />
                    <span>{labels?.mfaPasskeyBtn || "Verify with Windows Hello / Touch ID"}</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Method 2: Authenticator App (6-Digit TOTP) */}
          {activeMethod === "totp" && (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Smartphone className="size-3.5 text-muted-foreground" />
                  <span>{labels?.mfaCodeLabel || "6-Digit Authenticator Code"}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {labels?.mfaCodeHint ||
                    "Open your Authenticator app (Google Authenticator, Microsoft Authenticator, 1Password) and enter the 6-digit code."}
                </p>
              </div>

              <div className="space-y-1.5">
                <Input
                  id="totpCodeInput"
                  name="totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder={labels?.mfaCodePlaceholder || "000 000"}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (onVerifyTotp && totpCode.trim().length === 6 && !isLoading) {
                        void onVerifyTotp(totpCode.trim());
                      }
                    }
                  }}
                  className="h-9 text-center font-mono tracking-[0.4em] text-sm bg-background/80 border-border/70 rounded-md text-foreground focus:bg-background focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-foreground/50 transition-colors"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (onVerifyTotp && totpCode.trim().length === 6) {
                    void onVerifyTotp(totpCode.trim());
                  }
                }}
                disabled={isLoading || totpCode.trim().length !== 6}
                className="w-full h-8 text-xs font-medium justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <span>{labels?.mfaVerifySubmit || "Verify & Sign In"}</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Method 3: Email OTP */}
          {activeMethod === "email_otp" && (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <span>{labels?.mfaTabEmailOtp || "Email Verification Code"}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {maskedEmail
                    ? `${labels?.mfaEmailPrompt || "A 6-digit verification code will be sent to"} ${maskedEmail}`
                    : labels?.mfaEmailPrompt ||
                      "A 6-digit verification code will be sent to your registered email address."}
                </p>
              </div>

              {!emailSent ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSendEmail}
                  disabled={isLoading || isSendingEmail}
                  className="w-full h-8 text-xs font-medium justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>{labels?.mfaSendingEmail || "Sending code..."}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="size-3.5" />
                      <span>{labels?.mfaSendEmailBtn || "Send Code to Email"}</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <Input
                      id="emailOtpCodeInput"
                      name="emailOtp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoFocus
                      placeholder={labels?.mfaCodePlaceholder || "000 000"}
                      value={emailOtpCode}
                      onChange={(e) => setEmailOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (onVerifyEmailOtp && emailOtpCode.trim().length === 6 && !isLoading) {
                            void onVerifyEmailOtp(emailOtpCode.trim());
                          }
                        }
                      }}
                      className="h-9 text-center font-mono tracking-[0.4em] text-sm bg-background/80 border-border/70 rounded-md text-foreground focus:bg-background focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-foreground/50 transition-colors"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                    <span>{labels?.mfaEmailSentDesc || "Code expires in 5 minutes"}</span>
                    {resendCooldown > 0 ? (
                      <span>
                        {labels?.mfaResendEmailIn
                          ? `${labels.mfaResendEmailIn} ${resendCooldown}s`
                          : `Resend in ${resendCooldown}s`}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendEmail}
                        disabled={isSendingEmail}
                        className="inline-flex items-center gap-1 font-medium hover:text-foreground underline cursor-pointer"
                      >
                        <RefreshCw className="size-2.5" />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onVerifyEmailOtp && onVerifyEmailOtp(emailOtpCode)}
                    disabled={isLoading || emailOtpCode.trim().length !== 6}
                    className="w-full h-8 text-xs font-medium justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>{labels?.mfaVerifySubmit || "Verify & Sign In"}</span>
                        <ArrowRight className="size-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Google-Style "Use another verification method" Button (only when >1 method active) */}
          {methodsCount > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsChoosingMethod(true);
                setLocalError(null);
              }}
              className="w-full h-7 text-xs font-medium justify-between px-3 cursor-pointer"
            >
              <span>{labels?.mfaTryAnotherMethod || "Use another verification method"}</span>
              <ChevronRight className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </>
      )}

      {/* Back to Login / Use Another Account */}
      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3" />
          <span>{labels?.mfaBackToLogin || "Use another account / Back to login"}</span>
        </button>
      </div>
    </div>
  );
}

