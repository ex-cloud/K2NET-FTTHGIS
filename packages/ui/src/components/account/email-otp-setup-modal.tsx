import * as React from "react";
import { Mail, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../dialog";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { AccountLabels } from "./account-types";

export interface EmailOtpSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels?: AccountLabels;
  onSendCode: () => Promise<{ success: boolean; maskedEmail?: string; message?: string }>;
  onVerify: (code: string) => Promise<{ success: boolean; message?: string }>;
  onSuccess: () => void;
}

export function EmailOtpSetupModal({
  open,
  onOpenChange,
  labels,
  onSendCode,
  onVerify,
  onSuccess,
}: EmailOtpSetupModalProps) {
  const [maskedEmail, setMaskedEmail] = React.useState<string>("");
  const [isSending, setIsSending] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  React.useEffect(() => {
    let isMounted = true;
    if (open) {
      setCode("");
      setErrorMessage(null);
      setIsSending(true);
      onSendCode()
        .then((res) => {
          if (!isMounted) return;
          if (res.success) {
            if (res.maskedEmail) setMaskedEmail(res.maskedEmail);
            setCooldown(60);
          } else {
            setErrorMessage(res.message || "Failed to send verification code");
          }
          setIsSending(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          setErrorMessage(err instanceof Error ? err.message : "Failed to send verification code");
          setIsSending(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [open, onSendCode]);

  const handleResend = async () => {
    if (isSending || cooldown > 0) return;
    try {
      setIsSending(true);
      setErrorMessage(null);
      const res = await onSendCode();
      if (res.success) {
        if (res.maskedEmail) setMaskedEmail(res.maskedEmail);
        setCooldown(60);
      } else {
        setErrorMessage(res.message || "Failed to resend verification code");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to resend verification code");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setErrorMessage(labels?.mfaCodeInvalid || "Please enter a valid 6-digit verification code.");
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage(null);
      const res = await onVerify(code.trim());
      if (res.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        setErrorMessage(res.message || "Invalid 6-digit code. Please try again.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border text-foreground p-5">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            {labels?.mfaEmailModalTitle || "Enable Email Two-Factor Authentication"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {labels?.mfaEmailModalDesc ||
              "We sent a 6-digit verification code to your email address. Enter it below to confirm ownership and activate Email 2FA."}
          </DialogDescription>
        </DialogHeader>

        {isSending && !maskedEmail ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-xs">Sending verification code to your email...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-background/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {labels?.mfaStepVerify || "Enter 6-digit confirmation code"}
                </span>
                {maskedEmail && (
                  <span className="font-mono text-[11px] text-muted-foreground">{maskedEmail}</span>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email-mfa-verify-code" className="sr-only">
                  Verification Code
                </Label>
                <Input
                  id="email-mfa-verify-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder={labels?.mfaCodePlaceholder || "000000"}
                  value={code}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(clean);
                    setErrorMessage(null);
                  }}
                  className="font-mono text-center tracking-[0.3em] text-base h-10 border-border focus:ring-1"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span>Code valid for 5 minutes</span>
                {cooldown > 0 ? (
                  <span>Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isSending}
                    className="inline-flex items-center gap-1 font-medium text-foreground hover:underline cursor-pointer"
                  >
                    <RefreshCw className="size-3" />
                    <span>{labels?.mfaEmailSendCodeBtn || "Resend Code"}</span>
                  </button>
                )}
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-destructive pt-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isVerifying}
                className="text-xs"
              >
                {labels?.cancelBtn || "Cancel"}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isVerifying || code.length !== 6}
                className="gap-1.5 text-xs font-medium"
              >
                {isVerifying && <Loader2 className="size-3.5 animate-spin" />}
                <span>
                  {isVerifying
                    ? labels?.mfaVerifying || "Verifying..."
                    : labels?.mfaVerifyBtn || "Verify & Activate 2FA"}
                </span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

