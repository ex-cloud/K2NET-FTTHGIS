import * as React from "react";
import { Copy, Check, Smartphone, Key, AlertCircle, Loader2 } from "lucide-react";
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
import { QrSvg } from "./qr-svg";
import { AccountLabels } from "./account-types";

export interface TotpSetupData {
  secret: string;
  formattedSecret: string;
  otpauthUri: string;
  accountName: string;
  issuer: string;
}

export interface TotpSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels?: AccountLabels;
  onFetchSetup: () => Promise<TotpSetupData>;
  onVerify: (secret: string, code: string) => Promise<{ success: boolean; message?: string }>;
  onSuccess: () => void;
}

export function TotpSetupModal({
  open,
  onOpenChange,
  labels,
  onFetchSetup,
  onVerify,
  onSuccess,
}: TotpSetupModalProps) {
  const [setupData, setSetupData] = React.useState<TotpSetupData | null>(null);
  const [isLoadingSetup, setIsLoadingSetup] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  // Fetch setup data when modal opens
  React.useEffect(() => {
    let isMounted = true;
    if (open) {
      setCode("");
      setErrorMessage(null);
      setIsCopied(false);
      setIsLoadingSetup(true);
      onFetchSetup()
        .then((data) => {
          if (isMounted) {
            setSetupData(data);
            setIsLoadingSetup(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setErrorMessage(err?.message || "Failed to initialize 2FA setup");
            setIsLoadingSetup(false);
          }
        });
    } else {
      setSetupData(null);
    }
    return () => {
      isMounted = false;
    };
  }, [open, onFetchSetup]);

  const handleCopySecret = async () => {
    if (!setupData?.secret) return;
    try {
      await navigator.clipboard.writeText(setupData.secret);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || !code || code.trim().length !== 6) {
      setErrorMessage(labels?.mfaCodeInvalid || "Please enter a valid 6-digit code");
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage(null);
      const res = await onVerify(setupData.secret, code.trim());
      if (res.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        setErrorMessage(res.message || "Invalid 6-digit code. Please try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify code";
      setErrorMessage(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border text-foreground p-5">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Smartphone className="size-4 text-primary" />
            {labels?.mfaModalTitle || "Set Up Two-Factor Authentication"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {labels?.mfaModalDesc ||
              "Scan the QR code below or enter the key manually into your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, or Authy)."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingSetup ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-xs">Generating secure authenticator key...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {/* Step 1: Scan QR or Copy Key */}
            <div className="rounded-lg border border-border/80 bg-background/60 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    1
                  </span>
                  {labels?.mfaStepScan || "Scan QR Code"}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {setupData?.issuer || "K2NET FTTH"}
                </span>
              </div>

              {setupData?.otpauthUri && (
                <div className="flex justify-center py-1">
                  <QrSvg value={setupData.otpauthUri} size={150} />
                </div>
              )}

              {/* Manual setup key with 1-click copy */}
              <div className="space-y-1 pt-1 border-t border-border/40">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Key className="size-3" />
                    {labels?.mfaManualKeyLabel || "Or enter key manually:"}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="flex items-center gap-1 text-primary hover:underline text-[11px] font-medium"
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3 text-primary" />
                        <span className="text-primary">{labels?.mfaKeyCopied || "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>{labels?.mfaCopyKey || "Copy Key"}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 rounded bg-muted/40 border border-border/60 text-center font-mono text-xs tracking-wider select-all text-foreground">
                  {setupData?.formattedSecret || setupData?.secret}
                </div>
              </div>
            </div>

            {/* Step 2: Verification Code Input */}
            <div className="rounded-lg border border-border/80 bg-background/60 p-3.5 space-y-2">
              <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  2
                </span>
                {labels?.mfaStepVerify || "Enter 6-digit confirmation code"}
              </span>

              <div className="space-y-1">
                <Label htmlFor="mfa-verify-code" className="sr-only">
                  Verification Code
                </Label>
                <Input
                  id="mfa-verify-code"
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
                Cancel
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

