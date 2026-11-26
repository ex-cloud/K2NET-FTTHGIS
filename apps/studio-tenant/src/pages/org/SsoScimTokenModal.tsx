import * as React from "react";
import { KeyRound, Copy, Loader2, ShieldAlert, Check, Trash2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";

export interface CreateScimTokenModalProps {
  open: boolean;
  isCreating: boolean;
  createdPlainTextToken: string | null;
  onClose: () => void;
  onCreate: (name: string, expirationDays?: number) => Promise<void>;
}

export function SsoScimTokenModal({
  open,
  isCreating,
  createdPlainTextToken,
  onClose,
  onCreate,
}: CreateScimTokenModalProps) {
  const { t } = useTranslation();
  const [name, setName] = React.useState("");
  const [expiry, setExpiry] = React.useState("365");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open && !createdPlainTextToken) {
      setName("");
      setExpiry("365");
      setCopied(false);
    }
  }, [open, createdPlainTextToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const days = expiry === "never" ? undefined : Number(expiry);
    await onCreate(name.trim(), days);
  };

  const handleCopy = () => {
    if (!createdPlainTextToken || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(createdPlainTextToken);
    setCopied(true);
    toast.success(t("settings.sso_scim_token_copied"));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md border-border/80 bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            {createdPlainTextToken
              ? t("settings.sso_scim_token_created_title")
              : t("settings.sso_scim_token_create_title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {createdPlainTextToken
              ? t("settings.sso_scim_token_created_desc")
              : t("settings.sso_scim_token_create_desc")}
          </DialogDescription>
        </DialogHeader>

        {createdPlainTextToken ? (
          <div className="space-y-3 py-1">
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-[11px] text-destructive">
              <ShieldAlert className="size-3.5 shrink-0 mt-0.5" />
              <span>{t("settings.sso_scim_token_once_warning")}</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border border-border bg-muted/50 px-2.5 py-2 font-mono text-[11px] break-all text-foreground select-all">
                {createdPlainTextToken}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2.5 text-xs gap-1.5 shrink-0"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? t("settings.sso_scim_copied_short") : t("settings.sso_scim_copy_btn")}
              </Button>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                size="sm"
                onClick={onClose}
                className="h-7 px-2.5 text-xs font-medium"
              >
                {t("common.done")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="scim-token-name" className="text-xs font-medium">
                {t("settings.sso_scim_token_name_label")}
              </Label>
              <Input
                id="scim-token-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("settings.sso_scim_token_name_placeholder")}
                maxLength={120}
                className="h-8 text-xs bg-background border-border/80"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scim-token-expiry" className="text-xs font-medium">
                {t("settings.sso_scim_token_expiry_label")}
              </Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id="scim-token-expiry" className="h-8 text-xs bg-background border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">{t("settings.sso_scim_expiry_90")}</SelectItem>
                  <SelectItem value="180">{t("settings.sso_scim_expiry_180")}</SelectItem>
                  <SelectItem value="365">{t("settings.sso_scim_expiry_365")}</SelectItem>
                  <SelectItem value="never">{t("settings.sso_scim_expiry_never")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-7 px-2.5 text-xs"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating || !name.trim()}
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
              >
                {isCreating && <Loader2 className="size-3.5 animate-spin" />}
                {t("settings.sso_scim_generate_btn")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SsoScimConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md border-border/80 bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 px-2.5 text-xs"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            className="h-7 px-2.5 text-xs gap-1.5"
          >
            <Trash2 className="size-3.5" />
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

