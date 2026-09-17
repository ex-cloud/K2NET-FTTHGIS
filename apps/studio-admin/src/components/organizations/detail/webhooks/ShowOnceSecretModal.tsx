import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Badge,
} from "@k2net/ui";
import { Key, Lock, Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShowOnceSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "api-key" | "webhook-secret";
  secretValue: string | null;
  orgSlug: string;
}

export function ShowOnceSecretModal({
  isOpen,
  onClose,
  title,
  type,
  secretValue,
  orgSlug,
}: ShowOnceSecretModalProps) {
  const [copied, setCopied] = useState(false);

  if (!secretValue) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(secretValue);
    setCopied(true);
    toast.success(
      type === "api-key"
        ? "API Key berhasil disalin ke clipboard."
        : "HMAC Secret berhasil disalin ke clipboard."
    );
    setTimeout(() => setCopied(false), 3000);
  };

  const isApiKey = type === "api-key";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-card border-border shadow-lg p-6 space-y-4">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              {isApiKey ? <Key className="h-4.5 w-4.5" /> : <Lock className="h-4.5 w-4.5" />}
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Organisasi: <strong className="text-foreground">{orgSlug}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Security Warning Banner */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
            <strong>Penting:</strong> Kunci ini <u>hanya ditampilkan sekali</u>. Demi alasan
            keamanan, sistem hanya menyimpan hash SHA-256 dan kunci tidak dapat dimunculkan kembali
            setelah modal ini ditutup.
          </div>
        </div>

        {/* Secret Display & Copy Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span>{isApiKey ? "Plaintext API Key" : "Plaintext HMAC Secret"}</span>
            <Badge variant="outline" className="text-[9px] font-mono border-primary/30 bg-primary/10 text-primary">
              SHOW ONCE
            </Badge>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              readOnly
              value={secretValue}
              className="h-10 text-xs font-mono bg-background border-border text-foreground select-all"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Tersalin" : "Salin"}</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-2 sm:justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-8 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
          >
            Saya Sudah Menyimpan Kunci Ini
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
