import * as React from "react";
import { Copy, Check, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";

interface ShowApiKeySecretModalProps {
  apiKey: {
    name: string;
    scopes: string[];
    plainTextKey?: string;
  } | null;
  onClose: () => void;
}

export function ShowApiKeySecretModal({ apiKey, onClose }: ShowApiKeySecretModalProps) {
  const { t } = useTranslation();
  const [hasCopied, setHasCopied] = React.useState(false);

  const handleCopyKey = () => {
    if (apiKey?.plainTextKey) {
      navigator.clipboard.writeText(apiKey.plainTextKey);
      setHasCopied(true);
      toast.success(t("settings.developer.copied"));
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  return (
    <Dialog open={Boolean(apiKey)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <span>{t("settings.developer.created_success")}</span>
          </DialogTitle>
          <DialogDescription>
            {apiKey?.name} ({apiKey?.scopes.join(", ")})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2 text-amber-700 dark:text-amber-300 text-xs">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>{t("settings.developer.plain_text_warning")}</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("settings.developer.api_key_label")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={apiKey?.plainTextKey || ""}
                className="font-mono text-xs bg-muted/40"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyKey}
                className="shrink-0 gap-1.5"
              >
                {hasCopied ? (
                  <>
                    <Check className="size-3.5 text-primary" />
                    <span>{t("settings.developer.copied")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>{t("settings.developer.copy_btn")}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" onClick={onClose}>
            {t("common.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
