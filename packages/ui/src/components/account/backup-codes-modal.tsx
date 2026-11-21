import * as React from "react";
import {
  Copy,
  Check,
  Download,
  Printer,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
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
import { AccountLabels, BackupCodesStatusData } from "./account-types";

export interface BackupCodesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels?: AccountLabels;
  onFetchStatus: () => Promise<BackupCodesStatusData>;
  onGenerateCodes: () => Promise<{
    success: boolean;
    codes: string[];
    remainingCount?: number;
    totalCount?: number;
    generatedAt?: string;
    message?: string;
  }>;
  onSuccess?: () => void;
}

export function BackupCodesModal({
  open,
  onOpenChange,
  labels,
  onFetchStatus,
  onGenerateCodes,
  onSuccess,
}: BackupCodesModalProps) {
  const [statusData, setStatusData] = React.useState<BackupCodesStatusData | null>(null);
  const [newCodes, setNewCodes] = React.useState<string[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [isConfirmingRegenerate, setIsConfirmingRegenerate] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadStatus = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await onFetchStatus();
      setStatusData(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load backup codes status");
    } finally {
      setIsLoading(false);
    }
  }, [onFetchStatus]);

  React.useEffect(() => {
    if (open) {
      setNewCodes(null);
      setIsConfirmingRegenerate(false);
      setIsCopied(false);
      void loadStatus();
    }
  }, [open, loadStatus]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await onGenerateCodes();
      if (res.success && res.codes) {
        setNewCodes(res.codes);
        setIsConfirmingRegenerate(false);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.message || "Failed to generate backup codes");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate backup codes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!newCodes) return;
    const text = `K2NET FTTH GIS — EMERGENCY OFFLINE RECOVERY CODES\nGenerated: ${new Date().toISOString()}\n\n` +
      newCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      `\n\n* Each code can be used strictly once. Store in a secure offline location.`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    if (!newCodes) return;
    const text = `K2NET FTTH GIS — EMERGENCY OFFLINE RECOVERY CODES\nGenerated: ${new Date().toISOString()}\n\n` +
      newCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      `\n\n* Each code can be used strictly once. Store in a secure offline location.`;
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "k2net-emergency-backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    if (!newCodes) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>K2NET Emergency Recovery Codes</title>
            <style>
              body { font-family: monospace; padding: 40px; color: #111; }
              h2 { font-size: 16px; margin-bottom: 4px; }
              p { font-size: 12px; color: #555; margin-bottom: 20px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-width: 400px; margin-bottom: 20px; }
              .code { padding: 8px 12px; border: 1px dashed #999; font-size: 14px; font-weight: bold; letter-spacing: 2px; }
              .note { font-size: 11px; color: #777; border-top: 1px solid #ccc; padding-top: 12px; }
            </style>
          </head>
          <body>
            <h2>K2NET FTTH GIS — EMERGENCY OFFLINE RECOVERY CODES</h2>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <div class="grid">
              ${newCodes.map((c) => `<div class="code">${c}</div>`).join("")}
            </div>
            <div class="note">
              Each recovery code is valid for single-use authentication. Store in a secure offline vault or physical location.
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border border-border text-foreground p-5">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            <span>{labels?.backupCodesModalTitle || "Emergency Recovery Backup Codes"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {labels?.backupCodesModalDesc ||
              "Offline backup codes provide single-use access to your account if you lose your phone, passkeys, and email access."}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive flex items-start gap-2">
            <ShieldAlert className="size-3.5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span>Loading backup codes...</span>
          </div>
        ) : newCodes ? (
          /* View Newly Generated Codes */
          <div className="space-y-3.5 py-1">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">Save these codes immediately</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {labels?.backupCodesWarning ||
                    "This is the ONLY time these 10 recovery codes will be displayed in full. Store them in a secure password manager or physical vault."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3.5 rounded-lg border border-border/80 bg-muted/30 font-mono text-center text-xs tracking-wider">
              {newCodes.map((code, idx) => (
                <div
                  key={code}
                  className="p-1.5 rounded-md border border-border/60 bg-background/80 font-bold text-foreground selection:bg-primary/20"
                >
                  <span className="text-[10px] text-muted-foreground mr-1.5 font-normal">
                    {idx + 1}.
                  </span>
                  <span>{code}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
                className="gap-1.5 text-xs h-7"
              >
                {isCopied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
                <span>{isCopied ? labels?.backupCodesCopied || "Copied!" : labels?.backupCodesCopyBtn || "Copy All"}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTxt}
                className="gap-1.5 text-xs h-7"
              >
                <Download className="size-3" />
                <span>{labels?.backupCodesDownloadBtn || "Download (.txt)"}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs h-7"
              >
                <Printer className="size-3" />
                <span>{labels?.backupCodesPrintBtn || "Print"}</span>
              </Button>
            </div>
          </div>
        ) : isConfirmingRegenerate ? (
          /* Confirm Regeneration Guard */
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {labels?.backupCodesRegenerateConfirmTitle || "Regenerate new backup codes?"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {labels?.backupCodesRegenerateConfirmDesc ||
                    "Generating a new set of backup codes will immediately invalidate all your existing recovery codes. Any previously saved codes will no longer work."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Status & Existing Codes Overview */
          <div className="space-y-3.5 py-1">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-background/50">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  {statusData?.hasBackupCodes ? "Active Recovery Vault" : "Not Yet Configured"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {statusData?.hasBackupCodes
                    ? `${statusData.remainingCount} of ${statusData.totalCount} recovery codes available`
                    : "You do not have any emergency backup codes generated yet."}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`gap-1 text-[11px] font-medium ${
                  statusData?.hasBackupCodes && statusData.remainingCount > 0
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/80 bg-muted/30 text-muted-foreground"
                }`}
              >
                {statusData?.hasBackupCodes ? (
                  <ShieldCheck className="size-3" />
                ) : (
                  <ShieldAlert className="size-3" />
                )}
                <span>{statusData?.hasBackupCodes ? "Active" : "Inactive"}</span>
              </Badge>
            </div>

            {statusData?.hasBackupCodes && statusData.codes.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground">Code Hints & Status:</p>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 rounded-lg border border-border/60 bg-muted/20">
                  {statusData.codes.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded border text-xs font-mono ${
                        item.isUsed
                          ? "border-border/40 bg-muted/40 text-muted-foreground/60 line-through"
                          : "border-border/80 bg-background/80 text-foreground"
                      }`}
                    >
                      <span>{item.codeHint}</span>
                      <span className="text-[10px] font-sans no-underline">
                        {item.isUsed ? "Used" : "Active"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-border/60 gap-2 sm:gap-0">
          {newCodes ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium w-full sm:w-auto h-7"
            >
              <span>{labels?.doneBtn || "I've Saved My Codes"}</span>
            </Button>
          ) : isConfirmingRegenerate ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmingRegenerate(false)}
                className="text-xs h-7"
              >
                {labels?.cancelBtn || "Cancel"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleGenerate}
                disabled={isLoading}
                className="gap-1.5 text-xs h-7"
              >
                <RefreshCw className="size-3" />
                <span>Regenerate & Invalidate Old</span>
              </Button>
            </>
          ) : statusData?.hasBackupCodes ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs h-7"
              >
                {labels?.cancelBtn || "Close"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmingRegenerate(true)}
                className="gap-1.5 text-xs h-7"
              >
                <RefreshCw className="size-3" />
                <span>{labels?.backupCodesRegenerateBtn || "Regenerate New Codes"}</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs h-7"
              >
                {labels?.cancelBtn || "Cancel"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerate}
                disabled={isLoading}
                className="gap-1.5 text-xs h-7"
              >
                <KeyRound className="size-3" />
                <span>{labels?.backupCodesGenerateBtn || "Generate 10 Backup Codes"}</span>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
